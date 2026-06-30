"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, Zap, Users, ArrowRight } from "lucide-react";

export default function BetaAdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/telemetry')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div className="p-12 flex justify-center text-slate-500"><Activity className="w-8 h-8 animate-spin" /></div>;

  const msToMin = (ms: number) => (ms / 60000).toFixed(1) + 'm';

  const funnelSteps = [
    { key: 'onboarding_started', label: 'Signup Started' },
    { key: 'api_key_generated', label: 'API Key Generated' },
    { key: 'first_log_ingested', label: 'First Log Ingested' },
    { key: 'first_incident_created', label: 'First Incident Created' },
    { key: 'first_ai_analysis', label: 'First AI Analysis' },
    { key: 'first_playbook_run', label: 'First Playbook Run' }
  ];

  return (
    <div className="min-h-screen bg-[#050816] p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Zap className="w-8 h-8 text-indigo-500" /> Beta Telemetry
            </h1>
            <p className="text-slate-400 mt-2">Internal tracking dashboard for Sprint Beta-1 performance.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0a0e1a] border border-slate-800 p-6 rounded-2xl">
            <div className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-4"><Users className="w-4 h-4"/> Active Orgs</div>
            <div className="text-4xl font-bold text-white">{data?.metrics?.activeOrgs || 0}</div>
          </div>
          <div className="bg-[#0a0e1a] border border-slate-800 p-6 rounded-2xl">
            <div className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-4"><Clock className="w-4 h-4"/> Avg TTV (Time to Value)</div>
            <div className="text-4xl font-bold text-emerald-400">{data?.metrics ? msToMin(data.metrics.avgTtvMs) : '0m'}</div>
            <p className="text-xs text-slate-500 mt-2">Signup → First Incident</p>
          </div>
          <div className="bg-[#0a0e1a] border border-slate-800 p-6 rounded-2xl">
            <div className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-4"><Activity className="w-4 h-4"/> Avg TTA (Time to Autonomy)</div>
            <div className="text-4xl font-bold text-indigo-400">{data?.metrics ? msToMin(data.metrics.avgTtaMs) : '0m'}</div>
            <p className="text-xs text-slate-500 mt-2">Signup → First Playbook Run</p>
          </div>
        </div>

        <div className="bg-[#0a0e1a] border border-slate-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Activation Funnel</h2>
          <div className="space-y-4">
            {funnelSteps.map((step, idx) => {
              const count = data?.funnel?.[step.key] || 0;
              const max = data?.funnel?.onboarding_started || 1;
              const pct = (count / max) * 100;
              
              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div className="w-48 text-sm font-medium text-slate-300 flex items-center gap-2">
                    {idx > 0 && <ArrowRight className="w-3 h-3 text-slate-600" />} {step.label}
                  </div>
                  <div className="flex-1 bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-800">
                    <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-16 text-right font-mono text-sm text-slate-400">{count}</div>
                  <div className="w-16 text-right font-mono text-xs text-indigo-400">{pct.toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
