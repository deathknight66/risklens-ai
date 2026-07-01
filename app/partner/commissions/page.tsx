"use client";

import { useEffect, useState } from "react";
import { CircleDollarSign, CheckCircle2, Clock } from "lucide-react";

export default function PartnerCommissions() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/partner/commissions?partnerId=securita-global')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-12 text-slate-400">Loading Commissions...</div>;
  if (data.error) return <div className="p-12 text-rose-500">Error: {data.error}</div>;

  const { summary, history } = data;

  return (
    <div className="p-8 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <CircleDollarSign className="w-8 h-8 text-emerald-500" />
          Commissions & Revenue
        </h1>
        <p className="text-slate-400">Track payouts and ARR under management for your portfolio.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass p-6 rounded-xl border border-slate-700/50 bg-slate-800/20">
          <h3 className="text-sm font-medium text-slate-400 mb-2">ARR Under Management</h3>
          <div className="text-3xl font-bold text-white">${summary.arrUnderManagement.toLocaleString()}</div>
        </div>
        <div className="glass p-6 rounded-xl border border-slate-700/50 bg-slate-800/20">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Total Paid</h3>
          <div className="text-3xl font-bold text-emerald-400">${summary.paidTotal.toLocaleString()}</div>
        </div>
        <div className="glass p-6 rounded-xl border border-slate-700/50 bg-slate-800/20">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Pending Payout</h3>
          <div className="text-3xl font-bold text-amber-400">${summary.pendingTotal.toLocaleString()}</div>
        </div>
        <div className="glass p-6 rounded-xl border border-slate-700/50 bg-slate-800/20">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Aging Unpaid (&gt;30d)</h3>
          <div className="text-3xl font-bold text-rose-400">${summary.agingUnpaidTotal.toLocaleString()}</div>
        </div>
      </div>

      <div className="glass rounded-xl border border-slate-700/50 bg-slate-800/20 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-700/50 text-sm">
              <th className="p-4 text-slate-400 font-medium">Date</th>
              <th className="p-4 text-slate-400 font-medium">Tenant</th>
              <th className="p-4 text-slate-400 font-medium">Invoice ID</th>
              <th className="p-4 text-slate-400 font-medium text-right">Amount</th>
              <th className="p-4 text-slate-400 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((c: any) => (
              <tr key={c.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 transition-colors">
                <td className="p-4 text-slate-300">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="p-4 font-medium text-slate-200">{c.org_name}</td>
                <td className="p-4 font-mono text-xs text-slate-500">{c.invoice_id}</td>
                <td className="p-4 text-right font-bold text-white">${c.commission_amount.toLocaleString()}</td>
                <td className="p-4 text-center">
                  {c.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-bold">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">No commission history found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
