"use client";

import { useEffect, useState } from "react";
import { Briefcase, Building, AlertTriangle, Activity, ArrowLeft, Target, Calculator, Clock, CalendarDays, ShieldCheck } from "lucide-react";
import Link from 'next/link';

export default function BoardroomDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/board')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading Executive Finance Data...</div>;
  }

  if (!data || !data.all) {
    return <div className="p-12 text-center text-slate-400">Failed to load data.</div>;
  }

  const { all } = data;

  return (
    <div className="min-h-screen bg-[#050816] text-slate-300 font-sans pb-24 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <Link href="/admin/revenue" className="text-blue-500 hover:text-blue-400 flex items-center gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Revenue Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <Briefcase className="w-8 h-8 text-blue-500" />
            Boardroom Engine
          </h1>
          <p className="text-slate-400">Translate operational security proof into budget certainty for the CFO.</p>
        </div>

        {/* Boardroom Deal Cards */}
        <div className="space-y-8">
          {all.map((deal: any) => (
            <div key={deal.dealId} className="glass rounded-xl border border-slate-700 overflow-hidden">
              <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-white">{deal.company}</h2>
                  {deal.recommendedActions.length > 0 && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded flex items-center gap-2">
                      <Target className="w-3 h-3" />
                      Next Action: {deal.recommendedActions[0].action_recommendation}
                    </span>
                  )}
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-400">{deal.rcs}</div>
                    <div className="text-[10px] text-blue-500/70 uppercase">ROI Certainty (RCS)</div>
                  </div>
                  <div className="text-right border-l border-slate-700 pl-4">
                    <div className="text-2xl font-bold text-amber-400">{deal.rpi}</div>
                    <div className="text-[10px] text-amber-500/70 uppercase">Renewal Pressure (RPI)</div>
                  </div>
                  <div className="text-right border-l border-slate-700 pl-4">
                    <div className="text-2xl font-bold text-emerald-400">{deal.brs}</div>
                    <div className="text-[10px] text-emerald-500/70 uppercase">Board Readiness (BRS)</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-700">
                
                {/* CFO Zone */}
                <div className="p-6 space-y-4">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-4">
                    <Calculator className="w-4 h-4 text-emerald-400" /> CFO Zone
                  </h3>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Est. Annualized Savings</div>
                    <div className="text-lg font-semibold text-emerald-300">
                      ${((deal.boardMetrics?.estimated_loss_prevented || 0) + (deal.boardMetrics?.analyst_hours_saved || 0) * 80).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Cost of Inaction</div>
                    <div className="text-sm font-semibold text-rose-300">
                      ${(deal.boardMetrics?.estimated_loss_prevented || 0).toLocaleString()} / yr
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Insurance Premium Delta</div>
                    <div className="text-sm font-semibold text-slate-300">
                      ${(deal.boardMetrics?.insurance_premium_delta || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Budget Timing Map */}
                <div className="p-6 space-y-4">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-4">
                    <CalendarDays className="w-4 h-4 text-blue-400" /> Budget Timing
                  </h3>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Renewal Date</div>
                    <div className="text-sm font-semibold text-white">{deal.budgetCycle?.renewal_date || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Board Review Date</div>
                    <div className="text-sm font-semibold text-blue-300">{deal.budgetCycle?.board_meeting_date || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Budget Status</div>
                    <div className="text-sm font-semibold">
                      {deal.budgetCycle?.budget_locked ? (
                        <span className="text-rose-400">Locked (Requires Reallocation)</span>
                      ) : (
                        <span className="text-emerald-400">Fluid (Line Item Available)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Procurement Zone */}
                <div className="p-6 space-y-4">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" /> Procurement Zone
                  </h3>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Procurement Stage</div>
                    <div className="text-sm font-semibold capitalize text-indigo-300">
                      {deal.budgetCycle?.procurement_stage?.replace(/_/g, ' ') || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Budget Owner</div>
                    <div className="text-sm font-semibold text-slate-300">{deal.budgetCycle?.budget_owner || 'Unknown'}</div>
                  </div>
                </div>

                {/* Political Zone */}
                <div className="p-6 space-y-4">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-4">
                    <Building className="w-4 h-4 text-fuchsia-400" /> Political Zone
                  </h3>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Thread Strength</div>
                    <div className="text-sm font-semibold text-fuchsia-300">{deal.threadStrength}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Economic Buyer</div>
                    <div className="text-sm font-semibold text-slate-300">
                      {deal.execSponsors.find((s: any) => s.economic_buyer === 1)?.name || 'Not Identified'}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-700">
                    <Link href={`/board/report/${deal.orgId}`} className="block text-center w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors shadow">
                      Generate Board Packet
                    </Link>
                  </div>
                </div>

                {/* Benchmark Zone */}
                {deal.benchmarkSnapshot && (
                  <div className="p-6 space-y-4">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-4">
                      <Target className="w-4 h-4 text-purple-400" /> Benchmark Delta
                    </h3>
                    <div className="text-xs space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-slate-500 font-semibold border-b border-slate-700 pb-1">
                        <div>Metric</div>
                        <div className="text-right">Internal</div>
                        <div className="text-right">Percentile</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-slate-400">MTTR</div>
                        <div className="text-right text-slate-300 font-mono">{deal.benchmarkSnapshot.avg_mttr_minutes}m</div>
                        <div className="text-right text-purple-400 font-bold">{deal.benchmarkSnapshot.mttr_percentile}th</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-slate-400">Contain</div>
                        <div className="text-right text-slate-300 font-mono">{deal.benchmarkSnapshot.containment_rate}%</div>
                        <div className="text-right text-purple-400 font-bold">{deal.benchmarkSnapshot.containment_percentile}th</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-slate-400">ROI</div>
                        <div className="text-right text-slate-300 font-mono">{deal.benchmarkSnapshot.roi_multiple}x</div>
                        <div className="text-right text-purple-400 font-bold">{deal.benchmarkSnapshot.roi_percentile}th</div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
