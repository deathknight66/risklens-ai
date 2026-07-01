"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldCheck, Zap, ServerCrash, TrendingUp } from "lucide-react";

export default function PartnerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/partner/dashboard?partnerId=securita-global')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-12 text-slate-400">Loading Fleet Telemetry...</div>;
  if (data.error) return <div className="p-12 text-rose-500">Error: {data.error}</div>;

  const { metrics, tenants } = data;

  return (
    <div className="p-8 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Fleet Dashboard</h1>
        <p className="text-slate-400">Aggregated telemetry across all managed tenants.</p>
      </header>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass p-6 rounded-xl border border-slate-700/50 bg-slate-800/20">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-medium text-slate-400">Portfolio Health (PHS)</h3>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.portfolioHealthScore}%</div>
        </div>

        <div className="glass p-6 rounded-xl border border-slate-700/50 bg-slate-800/20">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-medium text-slate-400">Cross-Tenant MTTR Δ</h3>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.crossTenantMttrMedian}m</div>
        </div>

        <div className="glass p-6 rounded-xl border border-slate-700/50 bg-slate-800/20">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-medium text-slate-400">Active Playbooks Ratio</h3>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.activePlaybooksRatio}</div>
        </div>

        <div className="glass p-6 rounded-xl border border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center gap-3 mb-2">
            <ServerCrash className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-medium text-rose-400">Fleet SLA Breaches</h3>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.fleetSlaBreachCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Tenant Status */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white">Managed Tenants</h2>
          <div className="glass rounded-xl border border-slate-700/50 bg-slate-800/20 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/50 text-sm">
                  <th className="p-4 text-slate-400 font-medium">Organization</th>
                  <th className="p-4 text-slate-400 font-medium">Health Score</th>
                  <th className="p-4 text-slate-400 font-medium">Incidents Contained</th>
                  <th className="p-4 text-slate-400 font-medium">MTTR Reduction</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t: any) => (
                  <tr key={t.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-200">{t.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{t.slug}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        t.healthScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                        t.healthScore >= 50 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {t.healthScore}%
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{t.incidentsContained}</td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {t.mttrReduction}m
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">No active tenants managed.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: ROI & Value Delivered */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Value Delivered</h2>
          <div className="glass p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <h3 className="text-sm font-medium text-emerald-400 mb-2">Total Analyst Hours Saved</h3>
            <div className="text-4xl font-black text-white mb-4">{metrics.totalHoursSaved.toLocaleString()} hrs</div>
            <p className="text-sm text-slate-400">
              Aggregated across all {tenants.length} tenants. This metric is key for quarterly business reviews with your clients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
