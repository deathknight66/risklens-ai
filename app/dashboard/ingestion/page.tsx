'use client'

import { useState } from 'react'
import { UploadCloud, FileText, Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function IngestionPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload')
  const [dragActive, setDragActive] = useState(false)
  const [pastedLogs, setPastedLogs] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ parsed: number; alerts: number } | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.log') || file.name.endsWith('.json')) {
        setSelectedFile(file)
      } else {
        alert('Please upload .log or .json files only.')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.name.endsWith('.log') || file.name.endsWith('.json')) {
        setSelectedFile(file)
      } else {
        alert('Please upload .log or .json files only.')
      }
    }
  }

  const processLogs = async () => {
    if (activeTab === 'upload' && !selectedFile) return
    if (activeTab === 'paste' && !pastedLogs.trim()) return

    setIsProcessing(true)
    setResult(null)

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const payload = activeTab === 'upload' ? { filename: selectedFile?.name } : { raw: pastedLogs }
      
      // In real scenario, we would send the FormData or JSON to /api/ingest
      await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => ({ ok: true })) // Catch for mocked fetch since endpoint doesn't exist yet
      
      // Mocked result
      setResult({
        parsed: Math.floor(Math.random() * 5000) + 1000,
        alerts: Math.floor(Math.random() * 50) + 5
      })
      
      if (activeTab === 'upload') setSelectedFile(null)
      if (activeTab === 'paste') setPastedLogs('')
      
    } catch (error) {
      console.error('Error processing logs:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Data Ingestion & Normalization</h1>
        <p className="text-slate-400 mt-2">
          Securely upload raw security logs or JSON payloads for instant parsing and threat detection.
        </p>
      </div>

      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-emerald-400 font-semibold text-lg">Processing Complete</h3>
              <p className="text-slate-300 mt-1">
                Successfully ingested and normalized the data payload.
              </p>
              <div className="flex gap-6 mt-4">
                <div className="bg-[#0a0e1a]/50 px-4 py-2 rounded-lg border border-slate-700/50">
                  <div className="text-slate-400 text-sm">Logs Parsed</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {result.parsed.toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#0a0e1a]/50 px-4 py-2 rounded-lg border border-slate-700/50">
                  <div className="text-slate-400 text-sm">Alerts Detected</div>
                  <div className="text-2xl font-bold text-rose-400">
                    {result.alerts.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0a0e1a]/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('upload')}
            className={cn(
              "flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              activeTab === 'upload' 
                ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            )}
          >
            <UploadCloud className="w-4 h-4" />
            File Upload
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={cn(
              "flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              activeTab === 'paste' 
                ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            )}
          >
            <FileText className="w-4 h-4" />
            Paste Raw Logs
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'upload' ? (
            <div
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-200",
                dragActive ? "border-cyan-500 bg-cyan-500/10" : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50",
                selectedFile ? "border-emerald-500/50 bg-emerald-500/5" : ""
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".log,.json"
                onChange={handleFileSelect}
              />
              
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center pointer-events-none">
                {selectedFile ? (
                  <>
                    <Database className="w-12 h-12 text-emerald-400 mb-4" />
                    <p className="mb-2 text-sm text-slate-200 font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to process
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud className={cn(
                      "w-12 h-12 mb-4 transition-colors",
                      dragActive ? "text-cyan-400" : "text-slate-500"
                    )} />
                    <p className="mb-2 text-sm text-slate-300">
                      <span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">
                      Support for .log and .json files
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-64 relative">
              <textarea
                value={pastedLogs}
                onChange={(e) => setPastedLogs(e.target.value)}
                placeholder='{"timestamp": "2024-03-10T12:00:00Z", "event": "login_attempt", "status": "failed"}...'
                className="w-full h-full p-4 bg-[#050816] border border-slate-700/50 rounded-xl text-sm text-slate-300 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={processLogs}
              disabled={isProcessing || (activeTab === 'upload' && !selectedFile) || (activeTab === 'paste' && !pastedLogs.trim())}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
                isProcessing || (activeTab === 'upload' && !selectedFile) || (activeTab === 'paste' && !pastedLogs.trim())
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-cyan-500 hover:bg-cyan-400 text-[#050816] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Data...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  Process Logs
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
