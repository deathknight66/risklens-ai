"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, Target, CheckCircle2, AlertTriangle, ShieldCheck, Activity, ArrowLeft, Zap } from "lucide-react";
import Link from 'next/link';

export default function ExpansionDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/expansion')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Analyzing Expansion & Retention Data...</div>;
  }

  if (!data) {
    return <div className="p-12 text-center text-slate-400">Failed to load data.</div>;
  }

  const { all } = data;

  // Zones
  const redZone = all.filter((d: any) => d.churnRisk > 60 || d.threadStrength < 35 || d.driftScore > 65);
  const greenZone = all.filter((d: any) => d.expansionScore >= 50 && !redZone.includes(d));
  const yellowZone = all.filter((d: any) => !redZone.includes(d) && !greenZone.includes(d));

  return (
    <div className="min-h-screen bg-[#050816] text-slate-300 font-sans pb-24 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <Link href="/admin/revenue" className="text-fuchsia-500 hover:text-fuchsia-400 flex items-center gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Revenue Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-fuchsia-500" />
            Retention Risk Board
          </h1>
          <p className="text-slate-400">Live Operating System for Revenue Continuity: Expand, Retain, Predict.</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Red Zone: High Risk */}
          <div className="glass rounded-xl border border-rose-500/30 overflow-hidden">
            <div className="bg-rose-500/10 p-4 border-b border-rose-500/30 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h2 className="font-bold text-rose-100">Red Zone (Immediate Action)</h2>
            </div>
            <div className="p-4 space-y-4 bg-slate-900/50">
              {redZone.length === 0 ? (
                <div className="text-slate-500 text-sm py-4">No critical retention risks detected.</div>
              ) : (
                redZone.map((r: any) => (
                  <div key={r.dealId} className="p-4 rounded-lg border border-rose-500/20 bg-slate-800/50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Link href={`/admin/revenue/deal/${r.dealId}`} className="text-lg font-bold text-rose-300 hover:text-rose-400 transition-colors">
                          {r.company}
                        </Link>
                        <div className="flex gap-4 mt-1 text-xs text-slate-400">
                          <span className={r.churnRisk > 60 ? 'text-rose-400 font-bold' : ''}>Churn Risk: {r.churnRisk}</span>
                          <span className={r.threadStrength < 35 ? 'text-rose-400 font-bold' : ''}>Thread Strength: {r.threadStrength}</span>
                          <span className={r.driftScore > 65 ? 'text-rose-400 font-bold' : ''}>Drift: {r.driftScore}</span>
                        </div>
                      </div>
                    </div>
                    {/* Save Engine Actions */}
                    {r.recommendedActions?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-rose-500/20">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Recommended Retention Actions</h4>
                        <ul className="space-y-2">
                          {r.recommendedActions.map((act: any, idx: number) => (
                            <li key={idx} className="text-sm flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-rose-500/10">
                              <Zap className="w-4 h-4 text-amber-400" />
                              <span className="text-slate-300 capitalize">{act.action_type.replace(/_/g, ' ')}</span>
                            </li>
                          ))}
                        </ul>
                        <button className="mt-3 w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded transition-colors border border-rose-500/50">
                          Execute Playbook (Human-in-the-Loop)
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Yellow Zone: Stable but Declining */}
          <div className="glass rounded-xl border border-amber-500/30 overflow-hidden">
            <div className="bg-amber-500/10 p-4 border-b border-amber-500/30 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-amber-100">Yellow Zone (Watchlist)</h2>
            </div>
            <div className="p-4 space-y-4 bg-slate-900/50 h-full">
              {yellowZone.length === 0 ? (
                <div className="text-slate-500 text-sm py-4">No accounts in the watchlist.</div>
              ) : (
                yellowZone.map((y: any) => (
                  <div key={y.dealId} className="p-4 rounded-lg border border-amber-500/20 bg-slate-800/50">
                    <Link href={`/admin/revenue/deal/${y.dealId}`} className="text-base font-bold text-amber-300 hover:text-amber-400 transition-colors block mb-1">
                      {y.company}
                    </Link>
                    <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Thread Strength: {y.threadStrength}</span>
                      <span>Expansion: {y.expansionScore}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Green Zone: Expansion Ready */}
          <div className="glass rounded-xl border border-emerald-500/30 overflow-hidden">
            <div className="bg-emerald-500/10 p-4 border-b border-emerald-500/30 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-emerald-100">Green Zone (Expansion Ready)</h2>
            </div>
            <div className="p-4 space-y-4 bg-slate-900/50 h-full">
              {greenZone.length === 0 ? (
                <div className="text-slate-500 text-sm py-4">No immediate expansion candidates.</div>
              ) : (
                greenZone.map((g: any) => (
                  <div key={g.dealId} className="p-4 rounded-lg border border-emerald-500/20 bg-slate-800/50 flex justify-between items-center">
                    <div>
                      <Link href={`/admin/revenue/deal/${g.dealId}`} className="text-base font-bold text-emerald-300 hover:text-emerald-400 transition-colors block">
                        {g.company}
                      </Link>
                      <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 mt-1">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-500" /> {g.stakeholderCount}</span>
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-500/70" /> Spread: {g.championSpread}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">{g.expansionScore}</div>
                      <div className="text-[10px] text-emerald-500/70 uppercase font-semibold">Expansion Score</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
