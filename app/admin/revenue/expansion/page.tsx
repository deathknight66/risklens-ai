"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, Target, CheckCircle2, AlertTriangle, Clock, ShieldCheck, Activity, ArrowLeft } from "lucide-react";
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

  const { candidates, dormant, all } = data;
  const singleThreaded = all.filter((d: any) => d.hasSingleChampionRisk && !d.dormant);

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
            Revenue Continuity Engine
          </h1>
          <p className="text-slate-400">Expansion candidates, single-threaded risks, and dormant accounts.</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Top Expansion Candidates */}
          <div className="lg:col-span-2 glass rounded-xl border border-emerald-500/30 overflow-hidden">
            <div className="bg-emerald-500/10 p-4 border-b border-emerald-500/30 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-emerald-100">Top Expansion Candidates</h2>
            </div>
            <div className="p-4 space-y-4 bg-slate-900/50">
              {candidates.length === 0 ? (
                <div className="text-slate-500 text-sm py-4">No high-probability expansion candidates detected.</div>
              ) : (
                candidates.map((c: any) => (
                  <div key={c.dealId} className="p-4 rounded-lg border border-emerald-500/20 bg-slate-800/50 flex justify-between items-center">
                    <div>
                      <Link href={`/admin/revenue/deal/${c.dealId}`} className="text-lg font-bold text-emerald-300 hover:text-emerald-400 transition-colors">
                        {c.company}
                      </Link>
                      <div className="flex gap-4 mt-2 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><Users className="w-4 h-4 text-slate-500" /> {c.stakeholderCount} Stakeholders</span>
                        <span className="flex items-center gap-1"><Activity className="w-4 h-4 text-emerald-500/70" /> Champion Spread: {c.championSpread}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-400">{c.expansionScore}</div>
                      <div className="text-xs text-emerald-500/70 uppercase font-semibold">Expansion Score</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Retention Risks */}
          <div className="space-y-8">
            
            {/* Single Threaded Risk */}
            <div className="glass rounded-xl border border-amber-500/30 overflow-hidden">
              <div className="bg-amber-500/10 p-4 border-b border-amber-500/30 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-amber-100">Single-Threaded Risk</h2>
              </div>
              <div className="p-4 space-y-3 bg-slate-900/50">
                {singleThreaded.length === 0 ? (
                  <div className="text-slate-500 text-sm py-2">All accounts have multi-threading.</div>
                ) : (
                  singleThreaded.map((s: any) => (
                    <div key={s.dealId} className="flex justify-between items-center p-2 border-b border-slate-800 last:border-0">
                      <Link href={`/admin/revenue/deal/${s.dealId}`} className="font-semibold text-amber-200 hover:text-amber-300 transition-colors">
                        {s.company}
                      </Link>
                      <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded">1 Stakeholder</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dormant Accounts */}
            <div className="glass rounded-xl border border-rose-500/30 overflow-hidden">
              <div className="bg-rose-500/10 p-4 border-b border-rose-500/30 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h2 className="font-bold text-rose-100">Dormant Accounts</h2>
              </div>
              <div className="p-4 space-y-3 bg-slate-900/50">
                {dormant.length === 0 ? (
                  <div className="text-slate-500 text-sm py-2">No dormant accounts detected.</div>
                ) : (
                  dormant.map((d: any) => (
                    <div key={d.dealId} className="flex justify-between items-center p-2 border-b border-slate-800 last:border-0">
                      <div>
                        <Link href={`/admin/revenue/deal/${d.dealId}`} className="font-semibold text-rose-300 hover:text-rose-400 transition-colors block">
                          {d.company}
                        </Link>
                        <span className="text-xs text-slate-500">Action Required</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-rose-400">{d.churnRisk}</div>
                        <div className="text-[10px] text-rose-500/70 uppercase">Churn Risk</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
