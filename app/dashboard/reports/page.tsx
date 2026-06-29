'use client'

import { useState, useRef } from 'react'
import { FileText, Download, ShieldCheck, Activity, BrainCircuit, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { cn } from '@/lib/utils'

export default function ExecutiveReportingPage() {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: 'Last 30 Days' })
      })
      const data = await res.json()
      if (data.success) {
        setReport(data.report)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return
    const element = reportRef.current
    
    // Temporarily adjust styles for better PDF rendering if needed
    const canvas = await html2canvas(element, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`RiskLens_Executive_Report_${report.id}.pdf`)
  }

  const getRiskColor = (rating: string) => {
    switch(rating) {
      case 'Low': return 'text-emerald-500 bg-emerald-50'
      case 'Moderate': return 'text-amber-500 bg-amber-50'
      case 'High': return 'text-orange-500 bg-orange-50'
      case 'Critical': return 'text-rose-500 bg-rose-50'
      default: return 'text-slate-500 bg-slate-50'
    }
  }

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" /> Executive Reporting
          </h1>
          <p className="text-sm text-slate-400 mt-1">Generate board-ready compliance and financial impact reports.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            Generate Report
          </button>
          
          {report && (
            <button 
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg font-bold flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {!report && !loading && (
        <div className="glass p-12 text-center rounded-xl border border-slate-800">
          <FileText className="w-12 h-12 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">No report generated yet. Click "Generate Report" to compile the latest analytics and LLM summary.</p>
        </div>
      )}

      {loading && (
        <div className="glass p-12 text-center rounded-xl border border-slate-800">
          <Loader2 className="w-12 h-12 mx-auto text-indigo-500 mb-4 animate-spin" />
          <p className="text-slate-400">Synthesizing telemetry & generating executive narrative...</p>
        </div>
      )}

      {/* A4 REPORT PREVIEW */}
      {report && (
        <div className="overflow-x-auto p-4 bg-slate-900 rounded-xl">
          <div 
            ref={reportRef} 
            className="bg-white mx-auto text-slate-900 shadow-2xl p-12"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            {/* Header */}
            <div className="border-b-2 border-slate-200 pb-6 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">RiskLens AI</h1>
                <p className="text-lg text-slate-500 font-medium">Cybersecurity Executive Report</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Report Period</p>
                <p className="text-md text-slate-900 font-bold">{report.period}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(report.generatedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Risk Rating & Hash */}
            <div className="flex gap-4 mb-8">
              <div className={cn("px-6 py-4 rounded-xl border flex-1", getRiskColor(report.riskRating))}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1">Board-Level Risk Rating</p>
                <p className="text-3xl font-black">{report.riskRating}</p>
              </div>
              <div className="flex-2 bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Report Integrity Hash (SHA-256)</p>
                <p className="text-xs font-mono text-slate-800 break-all">{report.hash}</p>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-600" /> AI Executive Summary
              </h2>
              <p className="text-slate-700 leading-relaxed text-justify">
                {report.executiveSummary}
              </p>
            </div>

            {/* Financial & Ops KPI */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" /> Operational Efficiency
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">Policy Automation Rate</span>
                    <span className="font-bold text-slate-900">{report.snapshot.automationRate}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">Mean Time To Contain (MTTC)</span>
                    <span className="font-bold text-slate-900">{report.snapshot.mttc}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Blast Radius Reduction</span>
                    <span className="font-bold text-slate-900 text-sm w-32 text-right">{report.snapshot.blastRadiusReduction}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Financial Impact & Compliance
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">Projected Loss Avoided</span>
                    <span className="font-black text-emerald-600 text-lg">{report.snapshot.lossAvoided}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">Threat Recurrence Detection</span>
                    <span className="font-bold text-rose-600">{report.snapshot.threatRecurrence}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Compliance Mapping</span>
                    <span className="font-bold text-slate-900">MITRE ATT&CK, NIST CSF</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mb-8 page-break-inside-avoid">
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Recommended Next Quarter Actions</h2>
              <ul className="space-y-3">
                {report.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex gap-3 text-slate-700">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold flex-shrink-0">{i+1}</span>
                    <span className="pt-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Top Incidents */}
            <div className="page-break-inside-avoid">
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Top Critical Incidents</h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                    <th className="p-3 font-bold border-b border-slate-200">Incident ID</th>
                    <th className="p-3 font-bold border-b border-slate-200">Title</th>
                    <th className="p-3 font-bold border-b border-slate-200">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topIncidents.map((inc: any) => (
                    <tr key={inc.id} className="border-b border-slate-100">
                      <td className="p-3 text-xs font-mono text-slate-500">{inc.id.substring(0,8)}</td>
                      <td className="p-3 text-sm text-slate-800 font-medium">{inc.title}</td>
                      <td className="p-3">
                        <span className={cn("px-2 py-1 rounded text-xs font-bold", getRiskColor(inc.severity))}>
                          {inc.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400 font-medium">
              <p>Confidential & Proprietary. Generated by RiskLens AI Autonomous Governance Layer.</p>
              <p>Report ID: {report.id}</p>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
