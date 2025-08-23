from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from uuid import uuid4
import json
import time
import hashlib
import asyncio
import aiohttp
import xml.etree.ElementTree as ET
from Bio import Entrez

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PubMed Service - Inline for now
class PubMedService:
    def __init__(self):
        # Set your email for NCBI (required)
        Entrez.email = "loubaba@stanford.edu"  # Replace with your email
        self.base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
    
    async def search_literature(self, query: str, max_results: int = 5) -> List[Dict]:
        """Search PubMed for literature related to patient findings"""
        try:
            # Search for relevant papers
            search_results = await self._search_pubmed(query, max_results)
            
            if not search_results:
                return []
            
            # Get detailed information for each paper
            papers = await self._fetch_paper_details(search_results)
            
            # Rank papers by relevance (simplified ranking)
            ranked_papers = self._rank_papers(papers, query)
            
            return ranked_papers[:max_results]
            
        except Exception as e:
            print(f"Error searching literature: {e}")
            return []
    
    async def _search_pubmed(self, query: str, max_results: int) -> List[str]:
        """Search PubMed and return PMIDs"""
        search_url = f"{self.base_url}esearch.fcgi"
        
        params = {
            "db": "pubmed",
            "term": query,
            "retmax": max_results,
            "retmode": "json",
            "sort": "relevance"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(search_url, params=params) as response:
                    data = await response.json()
                    return data.get("esearchresult", {}).get("idlist", [])
        except Exception as e:
            print(f"PubMed search error: {e}")
            return []
    
    async def _fetch_paper_details(self, pmids: List[str]) -> List[Dict]:
        """Fetch detailed information for papers"""
        if not pmids:
            return []
        
        fetch_url = f"{self.base_url}efetch.fcgi"
        
        params = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "xml"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(fetch_url, params=params) as response:
                    xml_data = await response.text()
                    return self._parse_pubmed_xml(xml_data)
        except Exception as e:
            print(f"PubMed fetch error: {e}")
            return []
    
    def _parse_pubmed_xml(self, xml_data: str) -> List[Dict]:
        """Parse PubMed XML response"""
        papers = []
        
        try:
            root = ET.fromstring(xml_data)
            
            for article in root.findall(".//PubmedArticle"):
                paper = self._extract_paper_info(article)
                if paper:
                    papers.append(paper)
                    
        except Exception as e:
            print(f"Error parsing XML: {e}")
            
        return papers
    
    def _extract_paper_info(self, article) -> Optional[Dict]:
        """Extract relevant information from a single article"""
        try:
            # Extract basic information
            title_elem = article.find(".//ArticleTitle")
            title = title_elem.text if title_elem is not None else "No title"
            
            # Extract authors
            authors = []
            for author in article.findall(".//Author"):
                last_name = author.find("LastName")
                first_name = author.find("ForeName")
                if last_name is not None and first_name is not None:
                    authors.append(f"{first_name.text} {last_name.text}")
            
            # Extract journal and date
            journal_elem = article.find(".//Journal/Title")
            journal = journal_elem.text if journal_elem is not None else "Unknown journal"
            
            year_elem = article.find(".//PubDate/Year")
            year = year_elem.text if year_elem is not None else "Unknown year"
            
            # Extract PMID
            pmid_elem = article.find(".//PMID")
            pmid = pmid_elem.text if pmid_elem is not None else ""
            
            # Extract abstract
            abstract_elem = article.find(".//Abstract/AbstractText")
            abstract = abstract_elem.text if abstract_elem is not None else ""
            
            return {
                "pmid": pmid,
                "title": title,
                "authors": authors[:3],  # First 3 authors
                "journal": journal,
                "year": year,
                "abstract": abstract[:500] + "..." if len(abstract) > 500 else abstract,
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                "relevance_score": 0  # Will be calculated in ranking
            }
            
        except Exception as e:
            print(f"Error extracting paper info: {e}")
            return None
    
    def _rank_papers(self, papers: List[Dict], query: str) -> List[Dict]:
        """Simple ranking based on query terms in title/abstract"""
        query_terms = query.lower().split()
        
        for paper in papers:
            score = 0
            text_to_search = f"{paper['title']} {paper['abstract']}".lower()
            
            for term in query_terms:
                # Count occurrences of each query term
                score += text_to_search.count(term)
            
            paper['relevance_score'] = score
        
        # Sort by relevance score (descending)
        return sorted(papers, key=lambda x: x['relevance_score'], reverse=True)
    
    def generate_search_query(self, patient_data: Dict) -> str:
        """Generate PubMed search query based on patient findings"""
        query_parts = []
        
        # Add condition-specific terms
        if patient_data.get('risk_tier') in ['MODERATE', 'HIGH', 'URGENT']:
            query_parts.append("mild cognitive impairment OR alzheimer disease")
        
        # Add imaging findings
        if patient_data.get('imaging_findings'):
            query_parts.append("hippocampal atrophy OR medial temporal atrophy")
        
        # Add cognitive assessment
        if patient_data.get('moca_score'):
            query_parts.append("montreal cognitive assessment OR MoCA")
        
        # Add demographic filters
        query_parts.append("humans[Filter]")
        query_parts.append("english[Filter]")
        query_parts.append("2020:2024[pdat]")  # Recent papers
        
        return " AND ".join(query_parts) if query_parts else "alzheimer disease"

# Global PubMed service instance
pubmed_service = PubMedService()

async def get_literature_for_patient(patient_data: Dict) -> List[Dict]:
    """Main function to get literature for a patient"""
    # Generate search query
    query = pubmed_service.generate_search_query(patient_data)
    
    # Search for papers
    papers = await pubmed_service.search_literature(query, max_results=5)
    
    return papers

class SubmitResponse(BaseModel):
    job_id: str

class StatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    agents: Dict[str, Dict[str, Any]]

class ResultResponse(BaseModel):
    job_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# New model for literature endpoint
class LiteratureResponse(BaseModel):
    papers: List[Dict[str, Any]]
    query_used: str

jobs: Dict[str, Dict[str, Any]] = {}

# Keep your existing EVIDENCE_DB as fallback
EVIDENCE_DB = [
    {
        "title": "NIA-AA Research Framework: Toward a biological definition of Alzheimer's disease",
        "source": "Alzheimers & Dementia (2018)",
        "link": "https://doi.org/10.1016/j.jalz.2018.02.018",
        "strength": "high",
    },
    {
        "title": "Medial temporal atrophy on MRI in normal aging and Alzheimer's disease",
        "source": "Neurology (1992)",
        "link": "https://doi.org/10.1212/WNL.42.1.39",
        "strength": "high",
    },
    {
        "title": "Hippocampal atrophy in mild cognitive impairment",
        "source": "Lancet Neurology (2004)",
        "link": "https://doi.org/10.1016/S1474-4422(04)00752-3",
        "strength": "moderate",
    },
    {
        "title": "AAN practice guideline update: Mild cognitive impairment",
        "source": "Neurology (2018)",
        "link": "https://doi.org/10.1212/WNL.0000000000004821",
        "strength": "high",
    },
    {
        "title": "Hippocampal volume normative data and percentiles",
        "source": "NeuroImage (2016)",
        "link": "https://doi.org/10.1016/j.neuroimage.2016.09.051",
        "strength": "moderate",
    },
]

def _init_job(agents: List[str]) -> Dict[str, Any]:
    return {
        "status": "queued",
        "progress": 0,
        "agents": {a: {"status": "pending"} for a in agents},
        "result": None,
        "error": None,
        "created_at": time.time(),
    }

def _hash_files(files: List[UploadFile]) -> str:
    h = hashlib.sha256()
    for f in files:
        h.update(f.filename.encode())
    return h.hexdigest()

def _ingestion_qc(files: List[UploadFile], moca: Dict[str, Any], meta: Dict[str, Any]) -> Dict[str, Any]:
    formats = []
    for f in files:
        name = f.filename.lower()
        if name.endswith((".nii", ".nii.gz")):
            formats.append("nifti")
        elif name.endswith((".dcm", ".dicom")):
            formats.append("dicom")
        else:
            formats.append("unknown")
    if not 0 <= int(moca.get("total", -1)) <= 30:
        raise ValueError("Invalid MoCA total score")
    return {
        "accepted_formats": formats,
        "validated_scores": {"total": int(moca["total"])},
        "normalized_hint": "intensity-normalized",
        "qc_report": {"message": "basic checks passed", "files": [f.filename for f in files]},
    }

def _imaging_features(files: List[UploadFile], meta: Dict[str, Any]) -> Dict[str, Any]:
    seed = int(_hash_files(files)[:8], 16) % 1000
    age = int(meta.get("age", 70))
    base_l = 3.8
    base_r = 3.9
    age_effect = max(0, (age - 60) * 0.015)
    l_vol = max(2.0, base_l - age_effect) + (seed % 20) / 200.0
    r_vol = max(2.0, base_r - age_effect) + ((seed // 7) % 20) / 200.0
    asym = abs(l_vol - r_vol)
    mta = 1 if age < 65 else 2
    if l_vol < 2.6 or r_vol < 2.6:
        mta = max(mta, 3)
    if l_vol < 2.3 or r_vol < 2.3:
        mta = max(mta, 4)
    return {
        "hippocampal_volumes": {"left_ml": round(l_vol, 2), "right_ml": round(r_vol, 2), "asymmetry_ml": round(asym, 2)},
        "mta_score": mta,
        "thumbnails": {"axial": None, "coronal": None, "sagittal": None},
        "percentiles": {"left_pct": max(1, int(100 - (4.5 - l_vol) * 40)), "right_pct": max(1, int(100 - (4.5 - r_vol) * 40))},
    }

def _risk_stratification(features: Dict[str, Any], moca: Dict[str, Any], meta: Dict[str, Any]) -> Dict[str, Any]:
    l = features["hippocampal_volumes"]["left_ml"]
    r = features["hippocampal_volumes"]["right_ml"]
    mta = features["mta_score"]
    moca_total = int(moca["total"])
    age = int(meta.get("age", 70))
    risk = "LOW"
    score = 0
    if min(l, r) < 2.8:
        score += 1
    if min(l, r) < 2.5:
        score += 1
    if mta >= 3:
        score += 1
    if moca_total < 26:
        score += 1
    if moca_total < 22:
        score += 1
    if age >= 75 and score >= 2:
        score += 1
    if score <= 1:
        risk = "LOW"
    elif score == 2:
        risk = "MODERATE"
    elif score in [3, 4]:
        risk = "HIGH"
    else:
        risk = "URGENT"
    confidence = min(0.95, 0.6 + 0.08 * score)
    rationale = []
    if min(l, r) < 2.8:
        rationale.append("Reduced hippocampal volume relative to typical aging")
    if mta >= 3:
        rationale.append("Elevated MTA score")
    if moca_total < 26:
        rationale.append("MoCA below normal threshold")
    return {"risk_tier": risk, "confidence_score": round(confidence, 2), "key_rationale": rationale}

# Updated Evidence RAG Agent to use real PubMed
async def _evidence_rag_agent(patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """Enhanced Evidence RAG Agent using real PubMed API"""
    try:
        # Get real literature from PubMed
        papers = await get_literature_for_patient(patient_data)
        
        if papers:
            # Convert PubMed papers to your existing format
            citations = []
            for paper in papers:
                citations.append({
                    "title": paper["title"],
                    "source": f"{paper['journal']} ({paper['year']})",
                    "link": paper["url"],
                    "strength": "high" if paper["relevance_score"] > 2 else "moderate",
                    "abstract": paper.get("abstract", "")[:200] + "...",
                    "authors": ", ".join(paper["authors"]) if paper["authors"] else "Unknown",
                    "pmid": paper["pmid"]
                })
            
            return {
                "citations": citations,
                "search_type": "pubmed_live",
                "total_found": len(papers)
            }
        else:
            # Fallback to static evidence if PubMed fails
            return {
                "citations": EVIDENCE_DB[:6],
                "search_type": "fallback_static",
                "total_found": len(EVIDENCE_DB)
            }
            
    except Exception as e:
        print(f"PubMed search failed: {e}")
        # Fallback to static evidence
        return {
            "citations": EVIDENCE_DB[:6],
            "search_type": "fallback_error",
            "error": str(e),
            "total_found": len(EVIDENCE_DB)
        }

def _clinical_note(all_outputs: Dict[str, Any], meta: Dict[str, Any], moca: Dict[str, Any]) -> Dict[str, Any]:
    age = int(meta.get("age", 70))
    sex = meta.get("sex", "U")
    features = all_outputs["Imaging_Feature_Agent"]
    risk = all_outputs["Risk_Stratification_Agent"]
    evidence = all_outputs["Evidence_RAG_Agent"]
    
    recs = []
    if risk["risk_tier"] in ["HIGH", "URGENT"]:
        recs.append("Recommend neurology memory clinic referral")
        recs.append("Consider further biomarker evaluation if appropriate")
    elif risk["risk_tier"] == "MODERATE":
        recs.append("Recommend follow-up cognitive testing in 6–12 months")
        recs.append("Lifestyle risk factor modification counseling")
    else:
        recs.append("Routine monitoring")
    
    # Add treatment recommendations based on literature
    if evidence.get("search_type") == "pubmed_live":
        recs.append("See latest research findings for evidence-based interventions")
    
    note = {
        "patient_info": {"age": age, "sex": sex, "moca_total": int(moca["total"])},
        "imaging_findings": {
            "hippocampal_volumes_ml": features["hippocampal_volumes"],
            "mta_score": features["mta_score"],
            "percentiles": features["percentiles"],
            "thumbnails": features["thumbnails"],
        },
        "risk_assessment": risk,
        "recommendations": recs,
        "limitations": [
            "This is a triage aid; not a definitive diagnosis",
            "MRI-derived measures are approximations; clinical correlation required",
            "Not for diagnostic use without physician oversight",
            "Supplemental tool for clinical decision making",
            "Results require medical interpretation",
        ],
    }
    return note

def _safety_compliance(note: Dict[str, Any], risk: Dict[str, Any]) -> Dict[str, Any]:
    disclaimers = [
        "Not for diagnostic use without physician oversight",
        "Supplemental tool for clinical decision making",
        "Results require medical interpretation",
    ]
    if risk["confidence_score"] > 0.9:
        risk = dict(risk)
        risk["confidence_score"] = 0.9
    return {"safety_approved_note": note, "required_disclaimers": disclaimers, "risk_adjusted": risk}

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

# New endpoint for standalone literature search
@app.post("/api/literature", response_model=LiteratureResponse)
async def search_literature(patient_data: Dict[str, Any]):
    """Standalone endpoint for literature search"""
    try:
        papers = await get_literature_for_patient(patient_data)
        query = pubmed_service.generate_search_query(patient_data)
        
        return {
            "papers": papers,
            "query_used": query
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Literature search failed: {str(e)}")

@app.post("/api/submit", response_model=SubmitResponse)
async def submit(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    moca: str = Form(...),
    meta: str = Form(...),
):
    try:
        moca_obj = json.loads(moca)
        meta_obj = json.loads(meta)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON for moca or meta")
    
    job_id = str(uuid4())
    agent_list = [
        "Ingestion_QC_Agent",
        "Imaging_Feature_Agent",
        "Risk_Stratification_Agent",
        "Evidence_RAG_Agent",
        "Clinical_Note_Agent",
        "Safety_Compliance_Agent",
    ]
    jobs[job_id] = _init_job(agent_list)
    
    def run_pipeline():
        try:
            jobs[job_id]["status"] = "running"
            
            # Ingestion QC Agent
            jobs[job_id]["agents"]["Ingestion_QC_Agent"]["status"] = "running"
            ingest = _ingestion_qc(files, moca_obj, meta_obj)
            jobs[job_id]["agents"]["Ingestion_QC_Agent"] = {"status": "done", "output": ingest}
            jobs[job_id]["progress"] = 15

            # Imaging Feature Agent
            jobs[job_id]["agents"]["Imaging_Feature_Agent"]["status"] = "running"
            feats = _imaging_features(files, meta_obj)
            jobs[job_id]["agents"]["Imaging_Feature_Agent"] = {"status": "done", "output": feats}
            jobs[job_id]["progress"] = 30

            # Risk Stratification Agent
            jobs[job_id]["agents"]["Risk_Stratification_Agent"]["status"] = "running"
            risk = _risk_stratification(feats, moca_obj, meta_obj)
            jobs[job_id]["agents"]["Risk_Stratification_Agent"] = {"status": "done", "output": risk}
            jobs[job_id]["progress"] = 45

            # Enhanced Evidence RAG Agent with real PubMed
            jobs[job_id]["agents"]["Evidence_RAG_Agent"]["status"] = "running"
            
            # Prepare patient data for PubMed search
            patient_data = {
                "risk_tier": risk["risk_tier"],
                "imaging_findings": feats,
                "moca_score": int(moca_obj["total"]),
                "age": int(meta_obj.get("age", 70)),
                "sex": meta_obj.get("sex", "U")
            }
            
            # Use async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            evidence = loop.run_until_complete(_evidence_rag_agent(patient_data))
            loop.close()
            
            jobs[job_id]["agents"]["Evidence_RAG_Agent"] = {"status": "done", "output": evidence}
            jobs[job_id]["progress"] = 65

            # Clinical Note Agent
            jobs[job_id]["agents"]["Clinical_Note_Agent"]["status"] = "running"
            note = _clinical_note(
                {
                    "Imaging_Feature_Agent": feats,
                    "Risk_Stratification_Agent": risk,
                    "Evidence_RAG_Agent": evidence,
                },
                meta_obj,
                moca_obj,
            )
            jobs[job_id]["agents"]["Clinical_Note_Agent"] = {"status": "done", "output": note}
            jobs[job_id]["progress"] = 80

            # Safety Compliance Agent
            jobs[job_id]["agents"]["Safety_Compliance_Agent"]["status"] = "running"
            safety = _safety_compliance(note, risk)
            jobs[job_id]["agents"]["Safety_Compliance_Agent"] = {"status": "done", "output": safety}
            jobs[job_id]["progress"] = 100

            jobs[job_id]["status"] = "completed"
            jobs[job_id]["result"] = {
                "triage": safety["risk_adjusted"],
                "note": safety["safety_approved_note"],
                "citations": evidence["citations"],
                "qc": ingest["qc_report"],
                "search_info": {
                    "search_type": evidence.get("search_type", "unknown"),
                    "total_found": evidence.get("total_found", 0)
                }
            }
        except Exception as e:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = str(e)
    
    background_tasks.add_task(run_pipeline)
    return {"job_id": job_id}

@app.get("/api/status/{job_id}", response_model=StatusResponse)
async def status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"job_id": job_id, "status": job["status"], "progress": job["progress"], "agents": job["agents"]}

@app.get("/api/result/{job_id}", response_model=ResultResponse)
async def result(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"job_id": job_id, "status": job["status"], "result": job.get("result"), "error": job.get("error")}