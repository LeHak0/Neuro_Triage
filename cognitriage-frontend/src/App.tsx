import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { submitCase, getStatus, getResult, type StatusResponse, type ResultResponse, type RiskTier } from "./lib/api"
import { Button } from "@/components/ui/button"
import "./index.css"

type AgentName =
  | "Ingestion_QC_Agent"
  | "Imaging_Feature_Agent"
  | "Risk_Stratification_Agent"
  | "Evidence_RAG_Agent"
  | "Clinical_Note_Agent"
  | "Safety_Compliance_Agent"

const agentIcons: Record<AgentName, string> = {
  Ingestion_QC_Agent: "✅",
  Imaging_Feature_Agent: "🧠",
  Risk_Stratification_Agent: "⚖️",
  Evidence_RAG_Agent: "📚",
  Clinical_Note_Agent: "📝",
  Safety_Compliance_Agent: "🛡️",
}

function riskColor(tier?: RiskTier) {
  switch (tier) {
    case "LOW":
      return "bg-green-100 text-green-800 border-green-300"
    case "MODERATE":
      return "bg-yellow-100 text-yellow-800 border-yellow-300"
    case "HIGH":
      return "bg-orange-100 text-orange-800 border-orange-300"
    case "URGENT":
      return "bg-red-100 text-red-800 border-red-300"
    default:
      return "bg-zinc-100 text-zinc-800 border-zinc-300"
  }
}

export default function App() {
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [moca, setMoca] = useState<number | "">("")
  const [age, setAge] = useState<number | "">("")
  const [sex, setSex] = useState("F")

  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [result, setResult] = useState<ResultResponse | null>(null)
  const pollRef = useRef<number | null>(null)

  const useDemoCase = async () => {
    setMoca(24)
    setAge(68)
    setSex("F")
    const blob = new Blob(["demo mri"], { type: "application/octet-stream" })
    const demoFile = new File([blob], "demo_case_mci.nii.gz")
    setFiles([demoFile])
    setTimeout(() => {
      void startSubmit()
    }, 10)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const incoming: File[] = []
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      incoming.push(e.dataTransfer.files[i])
    }
    setFiles((prev) => [...prev, ...incoming])
  }, [])

  const onSelectFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const incoming: File[] = []
    for (let i = 0; i < e.target.files.length; i++) incoming.push(e.target.files[i])
    setFiles((prev) => [...prev, ...incoming])
  }, [])

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const canSubmit = useMemo(() => {
    return files.length > 0 && typeof moca === "number" && moca >= 0 && moca <= 30 && typeof age === "number" && age > 0
  }, [files, moca, age])

  const startSubmit = async () => {
    if (!canSubmit) return
    setJobId(null)
    setStatus(null)
    setResult(null)
    try {
      const res = await submitCase(files, { total: Number(moca) }, { age: Number(age), sex })
      setJobId(res.job_id)
    } catch (e) {
      alert(`Submit error: ${(e as Error).message}`)
    }
  }

  useEffect(() => {
    if (!jobId) return
    const poll = async () => {
      try {
        const st = await getStatus(jobId)
        setStatus(st)
        if (st.status === "completed" || st.status === "failed") {
          const rs = await getResult(jobId)
          setResult(rs)
          if (pollRef.current) window.clearInterval(pollRef.current)
          pollRef.current = null
        }
      } catch (e) {
        console.error(e)
      }
    }
    poll()
    const id = window.setInterval(poll, 1200)
    pollRef.current = id
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [jobId])

  const triage = result?.result?.triage
  const citations = result?.result?.citations ?? []

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">CogniTriage</h1>
          <p className="text-sm text-zinc-600">AI-Powered Cognitive Decline Screening</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* upload_zone */}
        <section className="lg:col-span-4 border border-zinc-200 rounded-lg p-4" aria-labelledby="upload-heading">
          <h2 id="upload-heading" className="text-base font-semibold mb-3">
            Upload and Patient Info
          </h2>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`w-full border-2 border-dashed rounded-md p-4 text-sm ${
              dragOver ? "border-zinc-800 bg-zinc-50" : "border-zinc-300"
            }`}
            role="region"
            aria-label="MRI drag and drop"
          >
            <p className="mb-2">
              Drag and drop MRI files (NIfTI .nii/.nii.gz or DICOM) here, or select files
            </p>
            <input
              aria-label="Select MRI files"
              type="file"
              multiple
              onChange={onSelectFiles}
              className="block w-full text-sm"
            />
            {files.length > 0 && (
              <ul className="mt-3 max-h-28 overflow-auto text-xs">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between py-1">
                    <span className="truncate">{f.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="col-span-1">
              <label className="text-sm font-medium">MoCA total (0-30)</label>
              <input
                type="number"
                min={0}
                max={30}
                value={moca}
                onChange={(e) => setMoca(e.target.value === "" ? "" : Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                aria-label="MoCA total score"
              />
            </div>
            <div className="col-span-1">
              <label className="text-sm font-medium">Age</label>
              <input
                type="number"
                min={1}
                value={age}
                onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                aria-label="Patient age"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Sex</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                aria-label="Patient sex"
              >
                <option value="F">Female</option>
                <option value="M">Male</option>
                <option value="U">Unspecified</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button variant="outline" onClick={useDemoCase} aria-label="Use demo case">
              Use Demo Case
            </Button>
            <Button onClick={startSubmit} disabled={!canSubmit} aria-label="Start analysis">
              Start Analysis
            </Button>
            {jobId && (
              <span className="text-xs text-zinc-600" aria-live="polite">
                Job: {jobId.slice(0, 8)}…
              </span>
            )}
          </div>

          {status && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span>Status: {status.status}</span>
                <span>{status.progress}%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded bg-zinc-200">
                <div
                  className="h-2 rounded bg-zinc-800 transition-all"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* agent_pipeline_status */}
        <section className="lg:col-span-4 border border-zinc-200 rounded-lg p-4" aria-labelledby="pipeline-heading">
          <h2 id="pipeline-heading" className="text-base font-semibold mb-3">
            Agent Pipeline
          </h2>
          <div className="flex flex-col gap-2">
            {(["Ingestion_QC_Agent","Imaging_Feature_Agent","Risk_Stratification_Agent","Evidence_RAG_Agent","Clinical_Note_Agent","Safety_Compliance_Agent"] as AgentName[]).map((a) => {
              const st = status?.agents?.[a]?.status ?? "pending"
              return (
                <div key={a} className="flex items-center justify-between border border-zinc-200 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span aria-hidden>{agentIcons[a]}</span>
                    <span className="text-sm">{String(a).replace(/_/g, " ")}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded border ${
                      st === "done"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : st === "running"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : st === "failed"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-zinc-50 text-zinc-700 border-zinc-200"
                    }`}
                    aria-label={`${a} status ${st}`}
                  >
                    {st}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* triage_card */}
        <section className="lg:col-span-4 border border-zinc-200 rounded-lg p-4" aria-labelledby="triage-heading">
          <h2 id="triage-heading" className="text-base font-semibold mb-3">
            Triage
          </h2>
          <div className={`rounded-md border p-4 ${riskColor(triage?.risk_tier as RiskTier | undefined)}`}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Risk Tier</div>
              <div className="text-2xl font-bold">{triage?.risk_tier ?? "-"}</div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-zinc-600">Confidence</div>
                <div className="font-semibold">{triage?.confidence_score != null ? `${Math.round(triage.confidence_score * 100)}%` : "-"}</div>
              </div>
              <div>
                <div className="text-zinc-600">Key Rationale</div>
                <ul className="list-disc pl-5">
                  {(triage?.key_rationale ?? []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* evidence_panel */}
        <section className="lg:col-span-6 border border-zinc-200 rounded-lg p-4" aria-labelledby="evidence-heading">
          <h2 id="evidence-heading" className="text-base font-semibold mb-3">
            Imaging Evidence
          </h2>
          {result?.result ? (
            <div className="text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded p-3">
                  <div className="text-zinc-600">Left hippocampus (ml)</div>
                  <div className="text-xl font-semibold">{result.result.note.imaging_findings.hippocampal_volumes_ml.left_ml}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-zinc-600">Right hippocampus (ml)</div>
                  <div className="text-xl font-semibold">{result.result.note.imaging_findings.hippocampal_volumes_ml.right_ml}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-zinc-600">MTA score</div>
                  <div className="text-xl font-semibold">{result.result.note.imaging_findings.mta_score}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="border rounded p-3">
                  <div className="text-zinc-600">Left percentile</div>
                  <div className="text-lg font-semibold">{result.result.note.imaging_findings.percentiles.left_pct}th</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-zinc-600">Right percentile</div>
                  <div className="text-lg font-semibold">{result.result.note.imaging_findings.percentiles.right_pct}th</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-600">Upload data and start analysis to view imaging findings.</p>
          )}
        </section>

        {/* citations_panel */}
        <section className="lg:col-span-6 border border-zinc-200 rounded-lg p-4" aria-labelledby="citations-heading">
          <h2 id="citations-heading" className="text-base font-semibold mb-3">
            Citations and Guidelines
          </h2>
          {citations.length > 0 ? (
            <ul className="space-y-2">
              {citations.map((c, i) => (
                <li key={i} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{c.title}</div>
                    <span className="text-xs px-2 py-1 rounded border bg-zinc-50">{c.strength}</span>
                  </div>
                  <div className="text-sm text-zinc-600">{c.source}</div>
                  <a className="text-sm text-blue-700 underline" href={c.link} target="_blank" rel="noreferrer">
                    View source
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-600">Relevant citations will appear after processing.</p>
          )}
        </section>

        {/* clinical_note */}
        <section className="lg:col-span-12 border border-zinc-200 rounded-lg p-4" aria-labelledby="note-heading">
          <h2 id="note-heading" className="text-base font-semibold mb-3">
            Structured Clinical Note
          </h2>
          {result?.result ? (
            <div className="text-sm space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="border rounded p-3">
                  <div className="text-zinc-600">Patient</div>
                  <div className="font-medium">
                    {result.result.note.patient_info.age}y, {result.result.note.patient_info.sex}
                  </div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-zinc-600">MoCA total</div>
                  <div className="font-medium">{result.result.note.patient_info.moca_total}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-zinc-600">Risk</div>
                  <div className={`inline-block px-2 py-1 rounded border ${riskColor(result.result.triage.risk_tier)}`}>
                    {result.result.triage.risk_tier}
                  </div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-zinc-600">Confidence</div>
                  <div className="font-medium">{Math.round(result.result.triage.confidence_score * 100)}%</div>
                </div>
              </div>

              <div className="border rounded p-3">
                <div className="text-zinc-600 mb-1">Recommendations</div>
                <ul className="list-disc pl-5">
                  {result.result.note.recommendations.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="border rounded p-3">
                <div className="text-zinc-600 mb-1">Limitations and Disclaimers</div>
                <ul className="list-disc pl-5">
                  {result.result.note.limitations.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                  <li>Not for diagnostic use without physician oversight</li>
                  <li>Supplemental tool for clinical decision making</li>
                  <li>Results require medical interpretation</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => window.print()}>Download PDF</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const n = result?.result?.note
                    if (!n) return
                    const text = JSON.stringify(n, null, 2)
                    navigator.clipboard.writeText(text)
                  }}
                >
                  Copy Note JSON
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-600">The structured note will appear here after processing completes.</p>
          )}
        </section>
      </main>
    </div>
  )
}
