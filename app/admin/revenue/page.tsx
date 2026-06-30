"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Activity, AlertTriangle, ShieldCheck, Clock, Users } from "lucide-react";

export default function RevenueDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/revenue")
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading revenue intelligence...</div>;
  }

  if (!data) {
    return <div className="p-12 text-center text-slate-400">Failed to load data.</div>;
  }

  const { funnel, weightedMrr, aging, pilotHealth, objectionWinRates, procurementTracker, renewalTriggers } = data;

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="min-h-screen bg-[#050816] p-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        <header>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="text-emerald-400 w-8 h-8" /> 
            GTM-2 Close Engine
          </h1>
          <p className="text-slate-400 mt-2">Pipeline Velocity, Objection Intelligence, and Pilot Health.</p>
        </header>

        {/* Top KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-sm font-medium text-emerald-400 mb-1">Weighted Pipeline MRR</p>
            <div className="text-3xl font-bold text-white font-mono">{formatCurrency(weightedMrr)}</div>
            <p className="text-xs text-slate-500 mt-1">Adjusted for champion score</p>
          </div>
          
          <div className="glass p-6 rounded-xl border border-slate-700/50">
            <p className="text-sm font-medium text-slate-400 mb-1">Total Leads</p>
            <div className="text-3xl font-bold text-white font-mono">{funnel.leads + funnel.contacted}</div>
          </div>
          
          <div className="glass p-6 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
            <p className="text-sm font-medium text-indigo-400 mb-1">Active Pilots</p>
            <div className="text-3xl font-bold text-white font-mono">{funnel.pilots_active}</div>
          </div>

          <div className="glass p-6 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5">
            <p className="text-sm font-medium text-fuchsia-400 mb-1">Conversions</p>
            <div className="text-3xl font-bold text-white font-mono">{funnel.conversions}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Pipeline Aging */}
          <div className="glass rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="bg-slate-800/50 p-4 border-b border-slate-700/50 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="font-semibold text-slate-200">Pipeline Aging (Deal Rot)</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">0–3 Days (Fresh)</span>
                  <span className="text-emerald-400 font-mono font-medium bg-emerald-400/10 px-2 rounded">{aging['0_3_days']} deals</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">4–7 Days (Cooling)</span>
                  <span className="text-indigo-400 font-mono font-medium bg-indigo-400/10 px-2 rounded">{aging['4_7_days']} deals</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">8–14 Days (Stalling)</span>
                  <span className="text-amber-400 font-mono font-medium bg-amber-400/10 px-2 rounded">{aging['8_14_days']} deals</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">14+ Days (Dead)</span>
                  <span className="text-rose-400 font-mono font-medium bg-rose-400/10 px-2 rounded">{aging['14_plus_days']} deals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Objection Win Rate */}
          <div className="glass rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="bg-slate-800/50 p-4 border-b border-slate-700/50 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h2 className="font-semibold text-slate-200">Objection Win Rate</h2>
            </div>
            <div className="p-0">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-900/50 text-slate-300">
                  <tr>
                    <th className="px-6 py-3 font-medium">Objection</th>
                    <th className="px-6 py-3 font-medium text-right">Raised</th>
                    <th className="px-6 py-3 font-medium text-right">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {objectionWinRates.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center border-none">No objections recorded yet.</td></tr>
                  ) : objectionWinRates.map((obj: any) => (
                    <tr key={obj.type} className="hover:bg-slate-800/30">
                      <td className="px-6 py-4 font-medium text-slate-300">{obj.type}</td>
                      <td className="px-6 py-4 text-right font-mono">{obj.raised}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          obj.winRate > 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {obj.winRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        {/* Pilot Health Score */}
        <div className="glass rounded-xl border border-slate-700/50 overflow-hidden mt-8">
          <div className="bg-slate-800/50 p-4 border-b border-slate-700/50 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-slate-200">Active Pilot Health Scores</h2>
          </div>
          <div className="p-0">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900/50 text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Organization</th>
                  <th className="px-6 py-4 font-medium text-right">Containment Rate</th>
                  <th className="px-6 py-4 font-medium text-right">TTFV (mins)</th>
                  <th className="px-6 py-4 font-medium text-right">Health Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {pilotHealth.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center border-none">No active pilot telemetry yet.</td></tr>
                ) : pilotHealth.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-medium text-slate-200">{p.organization}</td>
                    <td className="px-6 py-4 text-right font-mono">{p.containmentRate}%</td>
                    <td className="px-6 py-4 text-right font-mono">{p.ttfvMinutes}m</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        p.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' : 
                        p.status === 'passive' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {p.score} ({p.status})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Renewal Triggers & Expansion */}
        {(renewalTriggers?.length > 0 || procurementTracker?.some((p: any) => p.expansionScore > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="glass p-6 rounded-xl border border-emerald-500/50 bg-emerald-500/5">
              <h2 className="font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Active Renewal Triggers
              </h2>
              <div className="space-y-3">
                {renewalTriggers?.map((r: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-900/50 rounded border border-emerald-500/20 text-sm text-emerald-100">
                    <span className="font-bold text-emerald-400">{r.organization}:</span> {r.message}
                  </div>
                ))}
                {renewalTriggers?.length === 0 && <div className="text-slate-500 text-sm">No pilots have hit renewal thresholds yet.</div>}
              </div>
            </div>

            <div className="glass p-6 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
              <h2 className="font-semibold text-indigo-400 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" /> Expansion Signals
              </h2>
              <div className="space-y-3">
                {procurementTracker?.filter((p: any) => p.expansionScore > 0).map((p: any) => (
                  <div key={p.id} className="p-3 bg-slate-900/50 rounded border border-indigo-500/20 text-sm">
                    <div className="font-bold text-indigo-300 mb-1">{p.company} <span className="text-indigo-500/70 text-xs">({p.expansionScore} pts)</span></div>
                    <div className="flex gap-2 flex-wrap">
                      {p.expansionSignals.map((sig: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">{sig}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Procurement Tracker & Close Probability */}
        <div className="glass rounded-xl border border-slate-700/50 overflow-hidden mt-8">
          <div className="bg-slate-800/50 p-4 border-b border-slate-700/50 flex items-center gap-2">
            <Activity className="w-5 h-5 text-fuchsia-400" />
            <h2 className="font-semibold text-slate-200">Procurement Tracker & Close Probability</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400 min-w-[800px]">
              <thead className="bg-slate-900/50 text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Deal</th>
                  <th className="px-6 py-4 font-medium">Legal Status</th>
                  <th className="px-6 py-4 font-medium">Sec Review</th>
                  <th className="px-6 py-4 font-medium">Budget</th>
                  <th className="px-6 py-4 font-medium">Sponsor</th>
                  <th className="px-6 py-4 font-medium text-right">Close Prob %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {(!procurementTracker || procurementTracker.length === 0) ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center border-none">No active pilot deals found.</td></tr>
                ) : procurementTracker.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-medium text-slate-200">{p.company}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        p.legalStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                        p.legalStatus === 'blocked' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>{p.legalStatus}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        p.securityStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                        p.securityStatus === 'blocked' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>{p.securityStatus}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        p.budgetStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                        p.budgetStatus === 'blocked' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>{p.budgetStatus}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        p.execStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                        p.execStatus === 'blocked' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>{p.execStatus}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        p.closeProbability > 75 ? 'text-emerald-400' :
                        p.closeProbability > 40 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {p.closeProbability}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
