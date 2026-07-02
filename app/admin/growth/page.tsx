"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, Activity, Users, AlertTriangle, ArrowRight, Zap, Target, 
  BarChart2, Clock, CheckCircle2, ShieldAlert
} from "lucide-react";
import Link from "next/link";

export default function GrowthCommandCenter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/growth')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#191a1f] flex items-center justify-center text-slate-400">
        <Activity className="w-8 h-8 animate-pulse text-indigo-500" />
      </div>
    );
  }

  const { funnel, partnerLiquidity, assetMatrix, expansionCandidates, churnRisks } = data;

  return (
    <div className="min-h-screen bg-[#191a1f] text-slate-200 font-sans p-6 md:p-10 pb-20 selection:bg-indigo-500/30">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <div className="text-indigo-400 font-bold text-sm tracking-wider uppercase mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Operations
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Growth Command Center</h1>
        </div>
        <div className="text-right">
          <div className="text-slate-500 text-sm mb-1">Live Telemetry Sync</div>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ========================================================= */}
        {/* MODULE A: FUNNEL COMPRESSION */}
        {/* ========================================================= */}
        <section className="lg:col-span-3 bg-[#202127] rounded-[28px] p-8 border border-slate-800/60 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" /> Funnel Compression Pipeline
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            
            <div className="md:col-span-2 bg-[#282a31] rounded-2xl p-6 border border-slate-700/50 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Clock className="w-16 h-16 text-indigo-500" /></div>
              <div className="text-slate-400 text-sm font-medium mb-1">Median Time-to-First-ACE</div>
              <div className="text-4xl font-black text-indigo-400 font-mono">
                {Math.floor(funnel.medianTTFACE / 60)}h {Math.round(funnel.medianTTFACE % 60)}m
              </div>
              <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Target: &lt;24h (Healthy)
              </div>
            </div>

            <div className="bg-[#1e1f25] rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
              <div className="text-slate-500 text-xs font-bold uppercase">Signups</div>
              <div className="text-2xl font-bold text-white">{funnel.signups}</div>
            </div>
            <div className="bg-[#1e1f25] rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
              <div className="text-slate-500 text-xs font-bold uppercase">Conn. Install</div>
              <div className="text-2xl font-bold text-white">{funnel.connectorInstalls}</div>
              <div className="text-xs text-slate-600 mt-1">{Math.round((funnel.connectorInstalls/funnel.signups)*100)}%</div>
            </div>
            <div className="bg-[#1e1f25] rounded-2xl p-5 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
              <div className="text-slate-500 text-xs font-bold uppercase relative z-10">Simulated ACE</div>
              <div className="text-2xl font-bold text-indigo-300 relative z-10">{funnel.simulatedAce}</div>
              <div className="text-xs text-indigo-400/50 mt-1 relative z-10">{Math.round((funnel.simulatedAce/funnel.connectorInstalls)*100)}%</div>
            </div>
            <div className="bg-[#1e1f25] rounded-2xl p-5 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
              <div className="text-slate-500 text-xs font-bold uppercase relative z-10">Live ACE</div>
              <div className="text-2xl font-bold text-emerald-400 relative z-10">{funnel.firstLiveAce}</div>
              <div className="text-xs text-emerald-400/50 mt-1 relative z-10">{Math.round((funnel.firstLiveAce/funnel.simulatedAce)*100)}%</div>
            </div>

          </div>
        </section>


        {/* ========================================================= */}
        {/* MODULE D: EXPANSION TRIGGER ENGINE */}
        {/* ========================================================= */}
        <section className="lg:col-span-2 bg-[#202127] rounded-[28px] p-8 border border-emerald-900/30 shadow-[0_4px_24px_rgba(16,185,129,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" /> Expansion Trigger Engine
            </h2>
            <div className="text-xs font-medium bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
              High Probability Cohort
            </div>
          </div>

          <div className="space-y-3">
            {expansionCandidates.map((org: any) => (
              <div key={org.id} className="bg-[#1e1f25] border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-emerald-500/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#282a31] border border-slate-700 flex items-center justify-center font-bold text-lg text-slate-300">
                    {org.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-white group-hover:text-emerald-300 transition-colors">{org.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Intent: {org.intent}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">EPS Score</div>
                    <div className="font-mono font-bold text-emerald-400 text-lg">{org.eps}</div>
                  </div>
                  <Link href={`/admin/revenue/deal/${org.id}`} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
            {expansionCandidates.length === 0 && (
              <div className="text-center p-8 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                No immediate expansion candidates detected.
              </div>
            )}
          </div>
        </section>


        {/* ========================================================= */}
        {/* MODULE E: CHURN EARLY WARNING */}
        {/* ========================================================= */}
        <section className="bg-[#202127] rounded-[28px] p-8 border border-rose-900/30 shadow-[0_4px_24px_rgba(244,63,94,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" /> Churn Risk Layer
            </h2>
          </div>

          <div className="space-y-3">
            {churnRisks.map((org: any) => (
              <div key={org.id} className="bg-[#1e1f25] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 hover:border-rose-500/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-slate-200">{org.name}</div>
                  <div className="bg-rose-500/10 text-rose-400 font-mono font-bold text-xs px-2 py-1 rounded border border-rose-500/20">
                    Risk: {org.riskScore}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#282a31] p-2 rounded">
                    <div className="text-slate-500 mb-1">Time on Platform</div>
                    <div className="text-slate-300 font-medium">{org.daysSinceSignup} days</div>
                  </div>
                  <div className="bg-[#282a31] p-2 rounded">
                    <div className="text-slate-500 mb-1">Status</div>
                    <div className="text-amber-400 font-medium">Stalled in TTFV</div>
                  </div>
                </div>
              </div>
            ))}
            {churnRisks.length === 0 && (
              <div className="text-center p-8 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                No critical churn risks detected.
              </div>
            )}
          </div>
        </section>


        {/* ========================================================= */}
        {/* MODULE B: PARTNER LIQUIDITY */}
        {/* ========================================================= */}
        <section className="lg:col-span-2 bg-[#202127] rounded-[28px] p-8 border border-slate-800/60 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Partner Liquidity Board
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1e1f25] rounded-2xl p-5 border border-slate-800">
              <div className="text-slate-500 text-xs font-bold uppercase mb-2">Active MSSPs</div>
              <div className="text-3xl font-black text-white font-mono">{partnerLiquidity.activeMSSPs}</div>
            </div>
            <div className="bg-[#1e1f25] rounded-2xl p-5 border border-slate-800">
              <div className="text-slate-500 text-xs font-bold uppercase mb-2">Tenants / MSSP</div>
              <div className="text-3xl font-black text-white font-mono">{partnerLiquidity.tenantsPerMSSP}</div>
            </div>
            <div className="bg-[#1e1f25] rounded-2xl p-5 border border-slate-800">
              <div className="text-slate-500 text-xs font-bold uppercase mb-2">Propagations</div>
              <div className="text-3xl font-black text-white font-mono">{partnerLiquidity.playbooksPropagated}</div>
            </div>
            <div className="bg-[#1e1f25] rounded-2xl p-5 border border-blue-900/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
              <div className="text-slate-500 text-xs font-bold uppercase mb-2 relative z-10">Avg MP Rev/MSSP</div>
              <div className="text-3xl font-black text-blue-400 font-mono relative z-10">${partnerLiquidity.avgMarketplaceRevPerMSSP}</div>
            </div>
          </div>
        </section>


        {/* ========================================================= */}
        {/* MODULE C: ASSET PERFORMANCE MATRIX */}
        {/* ========================================================= */}
        <section className="bg-[#202127] rounded-[28px] p-8 border border-slate-800/60 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Asset Performance Matrix
          </h2>

          <div className="space-y-4">
            {assetMatrix.map((asset: any, idx: number) => (
              <div key={asset.id} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1e1f25] border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-200 truncate">{asset.name}</div>
                  <div className="text-xs text-slate-500 flex gap-3 mt-1">
                    <span>{asset.installs} inst.</span>
                    <span className="text-emerald-400/80">+{asset.retentionLift}% Ret</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-amber-400 text-sm">${asset.revenue}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
