"use client";

import { useEffect, useState } from "react";
import { Store, DollarSign, Download, Star, TrendingUp, PackagePlus } from "lucide-react";

export default function PartnerMarketplacePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/partner/marketplace')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading Creator Ecosystem...</div>;
  }

  if (!data || data.error) {
    return <div className="p-12 text-center text-rose-400">Failed to load marketplace data. {data?.error}</div>;
  }

  const { metrics, assets } = data;

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <Store className="w-8 h-8 text-fuchsia-500" />
            Creator Dashboard
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Track the performance, monetization, and adoption of your published security assets across the RiskLens network.
          </p>
        </div>
        
        <button className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded flex items-center gap-2 transition-colors">
          <PackagePlus className="w-4 h-4" /> Publish New Asset
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="glass rounded-xl p-6 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Gross Revenue
          </h3>
          <div className="text-3xl font-bold text-white font-mono">${metrics.gross_revenue.toLocaleString()}</div>
        </div>

        <div className="glass rounded-xl p-6 border border-slate-800 bg-slate-900/50">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Net Payout (Pending)
          </h3>
          <div className="text-3xl font-bold text-emerald-400 font-mono">${metrics.net_pending.toLocaleString()}</div>
        </div>

        <div className="glass rounded-xl p-6 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-400" /> Total Installs
          </h3>
          <div className="text-3xl font-bold text-white font-mono">{metrics.total_installs.toLocaleString()}</div>
        </div>

        <div className="glass rounded-xl p-6 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" /> Avg Rating
          </h3>
          <div className="text-3xl font-bold text-white font-mono">{metrics.avg_rating}</div>
        </div>

        <div className="glass rounded-xl p-6 border border-fuchsia-500/30 bg-fuchsia-500/5">
          <h3 className="text-sm font-semibold text-fuchsia-400 uppercase mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Retention Lift
          </h3>
          <div className="text-3xl font-bold text-fuchsia-400 font-mono">{metrics.retention_lift}</div>
        </div>
      </div>

      {/* Published Assets */}
      <h2 className="text-xl font-bold text-slate-200 mt-8 mb-4">Your Published Assets</h2>
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Asset Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Price</th>
              <th className="px-6 py-4 text-right">Installs</th>
              <th className="px-6 py-4 text-right">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {assets.map((asset: any) => (
              <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-200">{asset.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-800 text-xs font-bold text-slate-300 rounded uppercase">
                    {asset.category.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${asset.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {asset.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-300">
                  {asset.price === 0 ? 'Free' : `$${asset.price.toFixed(2)}`}
                </td>
                <td className="px-6 py-4 text-right text-slate-300">{asset.installs}</td>
                <td className="px-6 py-4 text-right font-medium text-amber-400">{asset.rating.toFixed(1)}</td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  You haven't published any assets to the marketplace yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
