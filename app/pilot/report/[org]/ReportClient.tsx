"use client";

import { useRef } from 'react';
import { Download, ShieldCheck, Activity } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function ReportClient({ orgName, metrics }: { orgName: string, metrics: any }) {
  const reportRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`RiskLens_Pilot_Report_${orgName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
      <div className="w-full max-w-[800px] flex justify-end mb-4">
        <button 
          onClick={downloadPDF}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      {/* A4 Document Container */}
      <div 
        ref={reportRef} 
        className="w-[800px] min-h-[1131px] bg-white shadow-2xl p-16 text-slate-900 relative"
      >
        <div className="absolute top-16 right-16 text-slate-300">
          <ShieldCheck className="w-12 h-12" />
        </div>

        <h1 className="text-4xl font-bold text-slate-900 mb-2">RiskLens Auto-Pilot Report</h1>
        <p className="text-xl text-slate-500 mb-12">Organization: {orgName}</p>

        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Incidents Analyzed</h3>
            <div className="text-5xl font-bold text-slate-900">{metrics.analyses_completed}</div>
          </div>
          <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200">
            <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">Containment Rate</h3>
            <div className="text-5xl font-bold text-emerald-600">{metrics.containment_rate}%</div>
          </div>
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">MTTR Saved (Avg)</h3>
            <div className="text-5xl font-bold text-slate-900">{metrics.mttr_delta_minutes}m</div>
          </div>
          <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-200">
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-2">Analyst Hours Saved</h3>
            <div className="text-5xl font-bold text-indigo-600">{metrics.analyst_hours_saved}h</div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-slate-200 pb-2 mb-6">Executive Summary</h2>
          <p className="text-slate-700 leading-relaxed text-lg">
            During the 14-day evaluation period, RiskLens processed <strong>{metrics.incidents_ingested}</strong> total incidents. 
            The autonomous intelligence engine successfully identified and resolved <strong>{metrics.prevented_escalations}</strong> 
            potential escalations without requiring manual intervention.
          </p>
          <p className="text-slate-700 leading-relaxed text-lg mt-4">
            By applying deterministic containment playbooks at a {metrics.containment_rate}% success rate, {orgName} realized 
            an immediate operational gain of {metrics.analyst_hours_saved} analyst hours. RiskLens recommends transitioning 
            proven playbooks from <em>Approval-Required</em> to <em>Fully Autonomous</em> to further accelerate ROI.
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-400 mt-32 pt-8 border-t border-slate-200">
          <Activity className="w-5 h-5" /> 
          Generated deterministically by RiskLens AI. Report data is immutable.
        </div>
      </div>
    </div>
  );
}
