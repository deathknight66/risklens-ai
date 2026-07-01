"use client";

import { useEffect, useState } from "react";
import { Network, DollarSign, AlertTriangle, Zap, Activity, Target, TrendingUp, Users, ShieldCheck, ArrowRight, PlaySquare } from "lucide-react";
import Link from 'next/link';

export default function PartnerWorkspace() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, the partnerId would be inferred from the authenticated user's token.
    // For the demo, we fetch the first partner.
    fetch('/api/partner/dashboard?partnerId=e4c2f1a6d9b07853') // Dummy id to be replaced by actual seeded id, but wait, the seeded id is random.
      // Wait, we need a way to get the partner id. Let's just pass no partnerId and have the API return the first one it finds if not provided, for demo purposes.
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading MSSP Workspace...</div>;
  }

  if (!data || !data.partner) {
    return (
      <div className="p-12 text-center text-slate-400">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-4" />
        Failed to load Partner Workspace. Make sure partner data is seeded.
      </div>
    );
  }

  const {
    partner,
    portfolio_health,
    at_risk_revenue,
    dependency_risk,
    automation_penetration,
    commissions_due,
    managed_mrr,
    partner_yield,
    accounts,
    expansion_heatmap
  } = data;

  return (
    <div className="min-h-screen bg-[#050816] text-slate-300 font-sans pb-24 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Network className="w-8 h-8 text-indigo-500" />
              <h1 className="text-3xl font-bold text-white">Partner Engine</h1>
            </div>
            <p className="text-slate-400">Portfolio health, cross-tenant distribution, and revenue yield for {partner.name}.</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-3xl font-black text-indigo-400">{portfolio_health}</div>
              <div className="text-[10px] text-indigo-500/70 uppercase tracking-wider font-bold">Portfolio Health (PHS)</div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Revenue Zone */}
          <div className="glass p-6 rounded-xl border border-slate-700 space-y-6">
            <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Revenue Zone
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 uppercase">Managed MRR</div>
                <div className="text-2xl font-bold text-white">${managed_mrr.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 uppercase">Partner Yield</div>
                <div className="text-2xl font-bold text-emerald-300">${partner_yield.toLocaleString()}</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-bold text-slate-300">Pending Commissions</div>
                <div className="text-sm font-bold text-emerald-400">${commissions_due.toLocaleString()}</div>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[100%]"></div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Dependency Risk (PDR)</h3>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-black text-amber-400">{dependency_risk}%</div>
                <p className="text-xs text-slate-500">Max single-tenant revenue concentration.</p>
              </div>
            </div>
          </div>

          {/* Risk Zone */}
          <div className="glass p-6 rounded-xl border border-slate-700 space-y-6">
            <h2 className="text-xl font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Risk Zone
            </h2>
            
            <div className="bg-rose-900/20 border border-rose-500/30 p-4 rounded-lg">
              <div className="text-xs text-rose-400 uppercase font-bold mb-1">At-Risk Portfolio ARR</div>
              <div className="text-3xl font-black text-rose-500">${at_risk_revenue.toLocaleString()}</div>
              <p className="text-xs text-rose-400/70 mt-2">Driven by single-threaded accounts (Thread Strength &lt; 40).</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase">Churn Watchlist</h3>
              {accounts.filter((a: any) => a.threadStrength < 40).map((acc: any) => (
                <div key={acc.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded border border-slate-700">
                  <div>
                    <div className="font-bold text-slate-200">{acc.name}</div>
                    <div className="text-xs text-slate-500">Thread Strength: {acc.threadStrength}</div>
                  </div>
                  <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded transition-colors">
                    Intervene
                  </button>
                </div>
              ))}
              {accounts.filter((a: any) => a.threadStrength < 40).length === 0 && (
                <div className="text-sm text-slate-500 italic">No high-risk accounts detected.</div>
              )}
            </div>
          </div>

          {/* Opportunity Zone */}
          <div className="glass p-6 rounded-xl border border-slate-700 space-y-6">
            <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
              <Target className="w-5 h-5" /> Opportunity Zone
            </h2>
            
            <div className="flex items-center gap-4 bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
              <div className="text-3xl font-black text-blue-400">{automation_penetration}%</div>
              <div>
                <div className="text-sm font-bold text-blue-300">Automation Penetration (APR)</div>
                <div className="text-xs text-blue-400/70">Tenants running &gt;1 active playbook.</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase">Cross-Tenant Expansion Heatmap</h3>
              {expansion_heatmap.length > 0 ? (
                expansion_heatmap.map((heatmap: any, i: number) => (
                  <div key={i} className="bg-slate-800/50 p-3 rounded border border-slate-700">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-bold text-slate-200">{heatmap.company}</div>
                      <div className="text-xs font-bold text-emerald-400">Score: {heatmap.score}</div>
                    </div>
                    <div className="text-xs text-slate-500">{heatmap.reason}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500 italic">No immediate expansion signals.</div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Distribution Engine</h3>
              <div className="bg-slate-800/80 p-4 rounded border border-slate-600">
                <div className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                  <PlaySquare className="w-4 h-4 text-indigo-400" /> Push Playbook to Portfolio
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Deploy "Credential Stuffing Lockdown v2" to 2 similar tenants lacking protection.
                </p>
                <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded transition-colors shadow flex justify-center items-center gap-2">
                  Execute Cross-Tenant Deployment <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
