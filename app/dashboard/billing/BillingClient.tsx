"use client";

import { useState } from "react";
import { Check, CreditCard, Download, ShieldAlert, Zap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BillingClient({ currentPlanId, stats, invoices, plans }: any) {
  const [upgrading, setUpgrading] = useState("");
  const [loadingPortal, setLoadingPortal] = useState(false);
  const router = useRouter();

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          successUrl: window.location.href,
          cancelUrl: window.location.href,
        })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initiate checkout");
        setUpgrading("");
      }
    } catch (err) {
      console.error(err);
      setUpgrading("");
    }
  };

  const handlePortal = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.href })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to launch portal");
        setLoadingPortal(false);
      }
    } catch (err) {
      console.error(err);
      setLoadingPortal(false);
    }
  };

  const planTiers = ["starter", "growth", "enterprise"];

  return (
    <div className="space-y-8">
      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UsageCard title="Logs Ingested" used={stats.logs.used} limit={stats.logs.limit} percent={stats.logs.percent} />
        <UsageCard title="AI Analyses" used={stats.analyses.used} limit={stats.analyses.limit} percent={stats.analyses.percent} />
        <UsageCard title="Active Seats" used={stats.seats.used} limit={stats.seats.limit} percent={stats.seats.percent} />
      </div>

      {/* Plans */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-100">Subscription Plans</h2>
          <button
            onClick={handlePortal}
            disabled={loadingPortal}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Manage Billing & Cards
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planTiers.map((pid) => {
            const plan = plans[pid];
            const isCurrent = currentPlanId === pid;
            
            return (
              <div key={pid} className={`relative p-6 rounded-2xl border ${isCurrent ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-900 border-slate-800'}`}>
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Current Plan
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-extrabold text-white">${plan.pricePerMonth}</span>
                  <span className="text-slate-400">/mo</span>
                </div>
                
                <ul className="space-y-3 mb-8 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> {plan.limits.logsIngested.toLocaleString()} Logs / mo</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> {plan.limits.aiAnalyses.toLocaleString()} AI Analyses</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> {plan.limits.seats} Seats</li>
                  {plan.overage.enabled && (
                    <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Pay-as-you-go Overage</li>
                  )}
                </ul>

                <button
                  disabled={isCurrent || !!upgrading}
                  onClick={() => handleUpgrade(pid)}
                  className={`w-full py-2.5 rounded-xl font-medium transition-all ${
                    isCurrent 
                      ? 'bg-indigo-500/10 text-indigo-400 cursor-default'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  }`}
                >
                  {upgrading === pid ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : isCurrent ? "Active" : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-4">Billing History</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-800/50 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {invoices.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center">No invoices found</td></tr>
              ) : invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">${(inv.amount).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-end gap-1 ml-auto">
                      <Download className="w-4 h-4" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsageCard({ title, used, limit, percent }: any) {
  const isDanger = percent >= 90;
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
      <h3 className="text-slate-400 text-sm font-medium mb-4">{title}</h3>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold text-white">{used.toLocaleString()}</span>
        <span className="text-sm text-slate-500">/ {limit > 1000000 ? 'Unlimited' : limit.toLocaleString()}</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${isDanger ? 'bg-rose-500' : 'bg-indigo-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isDanger && (
        <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> Nearing limit
        </p>
      )}
    </div>
  );
}
