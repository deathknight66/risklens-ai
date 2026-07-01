"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, ArrowDownRight, Target, ShieldCheck, Zap, Server, ChevronRight } from "lucide-react";

export default function PartnerBenchmarks() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/partner/benchmarks')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading Portfolio Benchmarks...</div>;
  }

  if (!data || data.error) {
    return <div className="p-12 text-center text-rose-400">Failed to load benchmark data. {data?.error}</div>;
  }

  const {
    portfolio_avg_mttr, portfolio_avg_apr, portfolio_avg_phs,
    global_cluster_avg_mttr, global_cluster_avg_apr, global_cluster_avg_phs,
    best_tenant, worst_tenant, improvement_gap
  } = data;

  const getDeltaColor = (internal: number, global: number, isLowerBetter: boolean = false) => {
    if (internal === global) return "text-slate-400";
    const good = isLowerBetter ? internal < global : internal > global;
    return good ? "text-emerald-400" : "text-rose-400";
  };

  const getDeltaIcon = (internal: number, global: number, isLowerBetter: boolean = false) => {
    if (internal === global) return null;
    const good = isLowerBetter ? internal < global : internal > global;
    return good ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <Target className="w-8 h-8 text-fuchsia-500" />
          Fleet Benchmark Engine
        </h1>
        <p className="text-slate-400">Compare your portfolio's performance against the global RiskLens network.</p>
      </div>

      {/* Main Metric Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* MTTR */}
        <div className="glass rounded-xl p-6 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-fuchsia-400" /> Median TTR
          </h3>
          <div className="flex items-end gap-4">
            <div className="text-4xl font-bold text-white font-mono">{portfolio_avg_mttr}m</div>
            <div className={`flex items-center font-bold text-sm mb-1 ${getDeltaColor(portfolio_avg_mttr, global_cluster_avg_mttr, true)}`}>
              {getDeltaIcon(portfolio_avg_mttr, global_cluster_avg_mttr, true)}
              {Math.abs(portfolio_avg_mttr - global_cluster_avg_mttr)}m vs Global
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-sm">
            <span className="text-slate-500">Global Cluster Avg</span>
            <span className="text-slate-300 font-mono">{global_cluster_avg_mttr}m</span>
          </div>
        </div>

        {/* Playbook Adoption */}
        <div className="glass rounded-xl p-6 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Playbook Penetration
          </h3>
          <div className="flex items-end gap-4">
            <div className="text-4xl font-bold text-white font-mono">{portfolio_avg_apr}%</div>
            <div className={`flex items-center font-bold text-sm mb-1 ${getDeltaColor(portfolio_avg_apr, global_cluster_avg_apr)}`}>
              {getDeltaIcon(portfolio_avg_apr, global_cluster_avg_apr)}
              {Math.abs(portfolio_avg_apr - global_cluster_avg_apr)}% vs Global
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-sm">
            <span className="text-slate-500">Global Cluster Avg</span>
            <span className="text-slate-300 font-mono">{global_cluster_avg_apr}%</span>
          </div>
        </div>

        {/* Portfolio Health */}
        <div className="glass rounded-xl p-6 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" /> Health Score (PHS)
          </h3>
          <div className="flex items-end gap-4">
            <div className="text-4xl font-bold text-white font-mono">{portfolio_avg_phs}</div>
            <div className={`flex items-center font-bold text-sm mb-1 ${getDeltaColor(portfolio_avg_phs, global_cluster_avg_phs)}`}>
              {getDeltaIcon(portfolio_avg_phs, global_cluster_avg_phs)}
              {Math.abs(portfolio_avg_phs - global_cluster_avg_phs)} vs Global
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-sm">
            <span className="text-slate-500">Global Cluster Avg</span>
            <span className="text-slate-300 font-mono">{global_cluster_avg_phs}</span>
          </div>
        </div>

      </div>

      {/* Optimization Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="glass rounded-xl border border-indigo-500/30 overflow-hidden bg-indigo-500/5">
          <div className="p-6">
            <h3 className="font-bold text-indigo-400 text-lg mb-2 flex items-center gap-2">
              <Server className="w-5 h-5" /> Portfolio Optimization
            </h3>
            <p className="text-slate-300 mb-6">
              If your weakest tenants matched the performance of your top quartile, you would reduce aggregate MTTR by <span className="font-bold text-fuchsia-400">{improvement_gap}%</span>.
            </p>
            
            <div className="space-y-4">
              <div className="bg-slate-900/50 p-4 rounded border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-500 uppercase">Top Performer</div>
                  <div className="font-bold text-emerald-400">{best_tenant?.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase">MTTR</div>
                  <div className="font-mono text-white">{best_tenant?.mttr}m</div>
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-500 uppercase">Needs Attention</div>
                  <div className="font-bold text-rose-400">{worst_tenant?.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase">MTTR</div>
                  <div className="font-mono text-white">{worst_tenant?.mttr}m</div>
                </div>
              </div>
            </div>
            
            <button className="mt-6 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded flex items-center justify-center gap-2 transition-colors">
              Propagate Top Playbooks <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="glass rounded-xl border border-slate-800 p-6">
           <h3 className="font-bold text-slate-200 text-lg mb-4">Competitive Standing</h3>
           <div className="space-y-6">
             <div>
               <div className="flex justify-between mb-2">
                 <span className="text-sm text-slate-400">Time to Remediate (Percentile)</span>
                 <span className="text-sm font-bold text-emerald-400">Top 15%</span>
               </div>
               <div className="h-2 w-full bg-slate-800 rounded overflow-hidden">
                 <div className="h-full bg-emerald-500 w-[85%] rounded"></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between mb-2">
                 <span className="text-sm text-slate-400">Automation Penetration (Percentile)</span>
                 <span className="text-sm font-bold text-blue-400">Top 30%</span>
               </div>
               <div className="h-2 w-full bg-slate-800 rounded overflow-hidden">
                 <div className="h-full bg-blue-500 w-[70%] rounded"></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between mb-2">
                 <span className="text-sm text-slate-400">Client Retention (Percentile)</span>
                 <span className="text-sm font-bold text-fuchsia-400">Top 5%</span>
               </div>
               <div className="h-2 w-full bg-slate-800 rounded overflow-hidden">
                 <div className="h-full bg-fuchsia-500 w-[95%] rounded"></div>
               </div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
