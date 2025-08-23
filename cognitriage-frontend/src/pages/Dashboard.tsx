import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
// import { getStatus, getResult, type RiskTier } from "../lib/api"
import { Button } from "@/components/ui/button"
import BrainVisualization from '../components/BrainVisualization';
import { useAppContext } from '../context/AppContext';

type RiskTier = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

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

export default function Dashboard() {
  const { patientData, setPatientData, analysisResult, setAnalysisResult } = useAppContext();
  const [dragOver, setDragOver] = useState(false)
  const pollRef = useRef<number | null>(null)

  // Extract values from context
  const { files, moca, age, sex } = patientData;
  const { jobId, status, result } = analysisResult;

  const useDemoCase = async () => {
    setPatientData({ moca: 24, age: 72, sex: "M", files: [] })
    setAnalysisResult({ jobId: null, status: null, result: null })
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/demo-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Demo failed: ${response.status}`)
      }
      
      const data = await response.json()
      setAnalysisResult({ jobId: data.job_id })
      
    } catch (error) {
      console.error('Demo submission failed:', error)
    }
  }

  const useDemoPathology = async () => {
    setPatientData({ moca: 19, age: 78, sex: "F", files: [] })
    setAnalysisResult({ jobId: null, status: null, result: null })
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/demo-pathology`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Demo pathology failed: ${response.status}`)
      }
      
      const data = await response.json()
      setAnalysisResult({ jobId: data.job_id })
      
    } catch (error) {
      console.error('Demo pathology submission failed:', error)
    }
  }

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const incoming: File[] = []
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      incoming.push(e.dataTransfer.files[i])
    }
    setPatientData({ files: [...files, ...incoming] })
  }, [files, setPatientData])

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const onSelectFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const incoming: File[] = []
    for (let i = 0; i < e.target.files.length; i++) {
      incoming.push(e.target.files[i])
    }
    setPatientData({ files: [...files, ...incoming] })
  }, [files, setPatientData])

  const removeFile = (idx: number) => {
    setPatientData({ files: files.filter((_, i) => i !== idx) })
  }

  const canSubmit = useMemo(() => {
    const hasFiles = files.length > 0
    const mocaValid = typeof moca === "number" ? moca >= 0 && moca <= 30 : true
    const ageValid = typeof age === "number" ? age > 0 : true
    return hasFiles && mocaValid && ageValid
  }, [files, moca, age])

  const startSubmit = async () => {
    if (!canSubmit) return
    setAnalysisResult({ jobId: null, status: null, result: null })
    
    try {
      const mocaVal = typeof moca === "number" ? moca : 24
      const ageVal = typeof age === "number" ? age : 70
      const API = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:8000'
      const fd = new FormData()
      files.forEach(f => fd.append('files', f))
      fd.append('moca', JSON.stringify({ total: Number(mocaVal) }))
      fd.append('meta', JSON.stringify({ age: Number(ageVal), sex }))

      const resp = await fetch(`${API}/api/submit`, {
        method: 'POST',
        body: fd,
      })
      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        throw new Error(text || `Submit failed: ${resp.status} ${resp.statusText}`)
      }
      const data = await resp.json()
      setAnalysisResult({ jobId: data.job_id })
    } catch (error) {
      console.error('Submit failed:', error)
    }
  }

  // Polling logic
  useEffect(() => {
    if (!jobId) return

    const poll = async () => {
      try {
        const API = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:8000'
        const statusResp = await fetch(`${API}/api/status/${jobId}`).then(r => r.json())
        setAnalysisResult({ status: statusResp })

        if (statusResp.status === 'completed') {
          const resultResp = await fetch(`${API}/api/result/${jobId}`).then(r => r.json())
          console.log('Dashboard - Full result response:', resultResp)
          console.log('Dashboard - Result data:', resultResp.result)
          setAnalysisResult({ 
            result: resultResp.result,
            triage: resultResp.result?.triage,
            note: resultResp.result?.note,
            citations: resultResp.result?.citations,
            trials: resultResp.result?.trials,
            treatment_recommendations: resultResp.result?.treatment_recommendations
          })
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
        }
      } catch (error) {
        console.error('Polling failed:', error)
      }
    }

    poll()
    pollRef.current = window.setInterval(poll, 2000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [jobId, setAnalysisResult])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cognitive Assessment Dashboard</h1>
        <div className="flex space-x-2">
          <Button onClick={useDemoCase} variant="outline">
            🧠 Demo - Healthy Case
          </Button>
          <Button onClick={useDemoPathology} variant="outline">
            ⚠️ Demo - Pathology Case
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div className="border border-zinc-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Upload MRI Data</h2>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-zinc-300'
              }`}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
            >
              <div className="space-y-2">
                <div className="text-4xl">🧠</div>
                <div className="text-sm text-gray-600">
                  Drag and drop NIfTI files (.nii, .nii.gz) or DICOM files
                </div>
                <input
                  type="file"
                  multiple
                  accept=".nii,.nii.gz,.dcm,.dicom"
                  onChange={onSelectFiles}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700"
                >
                  Choose Files
                </label>
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium">Selected Files:</h3>
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{file.name}</span>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Info */}
          <div className="border border-zinc-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MoCA Score (0-30)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={moca}
                  onChange={(e) => setPatientData({ moca: e.target.value ? Number(e.target.value) : "" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setPatientData({ age: e.target.value ? Number(e.target.value) : "" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sex
                </label>
                <select
                  value={sex}
                  onChange={(e) => setPatientData({ sex: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                  <option value="U">Unknown</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={startSubmit}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            {jobId && status?.status === 'running' ? 'Processing...' : 'Start Analysis'}
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {/* Triage Card */}
          {result?.triage && (
            <div className="border border-zinc-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Triage Assessment</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Risk Tier</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${riskColor(result.triage.risk_tier)}`}>
                    {result.triage.risk_tier}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Confidence</span>
                  <span className="text-sm font-medium">
                    {Math.round((result.triage.confidence_score || 0) * 100)}%
                  </span>
                </div>
                {result.triage.key_rationale && (
                  <div>
                    <span className="text-sm text-gray-600 block mb-2">Key Findings:</span>
                    <ul className="text-sm space-y-1">
                      {result.triage.key_rationale.map((item: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brain Visualization - Force Show */}
          {result?.note?.imaging_findings && (
            <div className="border border-zinc-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Brain Analysis</h2>
              <div style={{ backgroundColor: '#f8f9fa', padding: '10px', marginBottom: '10px', fontSize: '12px' }}>
                DEBUG: Has thumbnails = {!!result.note.imaging_findings.thumbnails}<br/>
                Thumbnails keys = {result.note.imaging_findings.thumbnails ? Object.keys(result.note.imaging_findings.thumbnails).join(', ') : 'none'}<br/>
                Axial data length = {result.note.imaging_findings.thumbnails?.axial?.length || 'none'}
              </div>
              <BrainVisualization 
                slices={result.note.imaging_findings.thumbnails || { axial: '', coronal: '', sagittal: '' }}
                volumes={result.note.imaging_findings}
                qualityMetrics={result.note.imaging_findings.quality_metrics || {}}
              />
            </div>
          )}

          {/* Progress */}
          {status && (
            <div className="border border-zinc-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Analysis Progress</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{status.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  Status: {status.status}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
