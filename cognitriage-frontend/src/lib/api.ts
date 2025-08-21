export type AgentStatus = "pending" | "running" | "done" | "failed"
export type RiskTier = "LOW" | "MODERATE" | "HIGH" | "URGENT"

export interface SubmitResponse { job_id: string }

export interface StatusResponse {
  job_id: string
  status: "queued" | "running" | "completed" | "failed"
  progress: number
  agents: Record<string, { status: AgentStatus; output?: any; error?: string }>
}

export interface ResultResponse {
  job_id: string
  status: "completed" | "failed" | "queued" | "running"
  result?: {
    triage: {
      risk_tier: RiskTier
      confidence_score: number
      key_rationale: string[]
    }
    note: any
    citations: { title: string; source: string; link: string; strength: string }[]
    qc: any
  }
  error?: string
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export async function submitCase(
  files: File[],
  moca: { total: number },
  meta: { age: number; sex: string }
): Promise<SubmitResponse> {
  const fd = new FormData()
  files.forEach((f) => fd.append("files", f))
  fd.append("moca", JSON.stringify(moca))
  fd.append("meta", JSON.stringify(meta))
  const res = await fetch(`${API_URL}/api/submit`, { method: "POST", body: fd })
  if (!res.ok) throw new Error(`Submit failed: ${res.status}`)
  return res.json()
}

export async function getStatus(jobId: string): Promise<StatusResponse> {
  const res = await fetch(`${API_URL}/api/status/${jobId}`)
  if (!res.ok) throw new Error(`Status failed: ${res.status}`)
  return res.json()
}

export async function getResult(jobId: string): Promise<ResultResponse> {
  const res = await fetch(`${API_URL}/api/result/${jobId}`)
  if (!res.ok) throw new Error(`Result failed: ${res.status}`)
  return res.json()
}
