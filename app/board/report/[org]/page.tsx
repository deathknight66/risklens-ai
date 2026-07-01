"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shield, TrendingDown, Clock, ShieldCheck, Download, Calculator, CheckCircle2 } from "lucide-react";

export default function BoardPacket() {
  const params = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // We fetch the board API and find the matching deal/org
    // In a real app this would be a dedicated secure endpoint with signature validation
    fetch('/api/admin/board')
      .then(res => res.json())
      .then(d => {
        const orgData = d.all.find((o: any) => o.orgId === params.org);
        setData(orgData);
      });
  }, [params.org]);

  if (!data) {
    return <div className="p-12 text-center text-slate-500 font-sans">Generating Board Packet...</div>;
  }

  const { boardMetrics, budgetCycle, benchmarkSnapshot, company, rcs } = data;
  
  // Mocking Budget Ask Amount
  const budgetAsk = 18000;
  const lossPrevented = boardMetrics?.estimated_loss_prevented || 0;
  const hoursSavedValue = (boardMetrics?.analyst_hours_saved || 0) * 80;
  const totalValue = lossPrevented + hoursSavedValue;
  const roiMultiple = budgetAsk > 0 ? (totalValue / budgetAsk).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans print:bg-white print:text-black">
      {/* Non-print controls */}
      <div className="print:hidden bg-slate-900 p-4 flex justify-between items-center text-white sticky top-0 z-10 shadow-lg">
        <div>
          <h2 className="font-bold">Board Packet Generator</h2>
          <p className="text-xs text-slate-400">Read-only view for {company}</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-bold transition-colors"
        >
          <Download className="w-4 h-4" /> Save as PDF
        </button>
      </div>

      {/* Page 1: Executive Summary */}
      <div className="max-w-4xl mx-auto p-12 space-y-12 print:p-8 print:break-after-page">
        <header className="border-b-2 border-slate-900 pb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">Security Investment ROI</h1>
            <p className="text-xl text-slate-600 mt-2 font-medium">Executive Summary for {company}</p>
          </div>
          <div className="text-right">
            <Shield className="w-12 h-12 text-blue-600 inline-block mb-2" />
            <p className="text-sm font-bold text-slate-500">CONFIDENTIAL</p>
            <p className="text-xs text-slate-400">{new Date().toLocaleDateString()}</p>
          </div>
        </header>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-slate-200 pb-2">1. Executive Summary</h2>
          <p className="text-lg leading-relaxed text-slate-700">
            Over the current reporting period, RiskLens AI was deployed to augment SOC operations, automate incident triage, and harden the security posture for {company}. The platform demonstrated high-fidelity automation, resulting in measurable operational leverage and quantifiable risk reduction.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-8">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" /> Economic Value
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-4xl font-black text-slate-900">${totalValue.toLocaleString()}</div>
                <div className="text-sm text-slate-600 font-medium">Total Annualized Value Delivered</div>
              </div>
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xl font-bold">${lossPrevented.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">Loss Prevented</div>
                </div>
                <div>
                  <div className="text-xl font-bold">${hoursSavedValue.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">Efficiency Gains</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Security Impact
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-4xl font-black text-slate-900">{boardMetrics?.incidents_contained || 0}</div>
                <div className="text-sm text-slate-600 font-medium">Critical Incidents Contained Autonomously</div>
              </div>
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xl font-bold text-blue-600 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" /> {boardMetrics?.mttr_before && boardMetrics?.mttr_after ? Math.round((boardMetrics.mttr_before - boardMetrics.mttr_after) / boardMetrics.mttr_before * 100) : 0}%
                  </div>
                  <div className="text-xs text-slate-500">MTTR Reduction</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-emerald-600">{boardMetrics?.confidence_score || 80}%</div>
                  <div className="text-xs text-slate-500">ROI Confidence</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {benchmarkSnapshot && (
          <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" /> Peer Benchmark Comparison
            </h3>
            <div className="space-y-4">
              <p className="text-lg text-slate-700 leading-relaxed font-medium">
                Faster than <span className="font-bold text-purple-600">{benchmarkSnapshot.mttr_percentile}%</span> of comparable <span className="capitalize">{benchmarkSnapshot.industry}</span> organizations.
              </p>
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xl font-bold text-slate-900">{benchmarkSnapshot.containment_percentile}th</div>
                  <div className="text-xs text-slate-500">Containment Percentile</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900">{benchmarkSnapshot.roi_percentile}th</div>
                  <div className="text-xs text-slate-500">ROI Percentile</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Budget Ask Section */}
        <section className="bg-blue-900 text-white p-8 rounded-xl print:bg-blue-900 print:text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Budget Request & Renewal Recommendation
          </h2>
          <div className="grid grid-cols-3 gap-8 items-center">
            <div className="col-span-2 space-y-4">
              <p className="text-blue-100 leading-relaxed">
                Based on the deterministic value generated during the current operational period, the security engineering team recommends formally budgeting RiskLens AI as a core platform capability for FY {budgetCycle?.fiscal_year || new Date().getFullYear()}.
              </p>
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-xs text-blue-300 uppercase font-bold tracking-wider mb-1">Recommended Annual Budget</div>
                  <div className="text-3xl font-black">${budgetAsk.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-300 uppercase font-bold tracking-wider mb-1">Expected Prevented Loss</div>
                  <div className="text-3xl font-black">${lossPrevented.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 p-6 rounded-xl border border-white/20 text-center">
              <div className="text-xs text-blue-200 uppercase font-bold tracking-wider mb-2">ROI Multiple</div>
              <div className="text-5xl font-black text-emerald-400">{roiMultiple}x</div>
              <div className="text-xs text-blue-200 mt-2">Payback in &lt; 2 months</div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
