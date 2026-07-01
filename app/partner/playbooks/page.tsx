"use client";

import { useEffect, useState } from "react";
import { BookOpen, Share, CheckCircle2, AlertTriangle, Fingerprint } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function PartnerPlaybooks() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [propagating, setPropagating] = useState(false);
  const [propagateResult, setPropagateResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/partner/dashboard?partnerId=securita-global')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-12 text-slate-400">Loading Playbooks...</div>;

  const { tenants } = data;

  const handlePropagate = async () => {
    setPropagating(true);
    setPropagateResult(null);
    
    const idempotencyKey = `propagate-${uuidv4()}`;

    try {
      const res = await fetch('/api/partner/playbooks/propagate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: 'securita-global',
          partnerUserId: 'usr_mock_mssp', // In reality from session
          playbookId: 'pb-123', // Mock playbook ID, in a real app this would be selected
          targetTenantIds: tenants.map((t: any) => t.id),
          idempotencyKey,
          isDryRun: false
        })
      });

      const result = await res.json();
      setPropagateResult(result);
    } catch (err: any) {
      setPropagateResult({ error: err.message });
    } finally {
      setPropagating(false);
    }
  };

  return (
    <div className="p-8 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-500" />
          Global Playbooks
        </h1>
        <p className="text-slate-400">Manage standard operating procedures and propagate them across your tenant fleet.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Playbook Library */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-xl border border-slate-700/50 bg-slate-800/20">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Credential Stuffing Lockdown v2</h2>
                <p className="text-sm text-slate-400 mt-1">Portfolio Visibility • Version 2</p>
              </div>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold border border-indigo-500/30">
                2 Tenants Adopted
              </span>
            </div>

            <pre className="bg-slate-900/80 p-4 rounded-lg text-sm text-slate-300 font-mono border border-slate-700/50 mb-6">
{`{
  "steps": [
    "isolate_affected_user",
    "reset_credentials",
    "notify_tenant_admin"
  ],
  "triggers": [
    "failed_auth_spike",
    "impossible_travel"
  ]
}`}
            </pre>

            <div className="border-t border-slate-700/50 pt-6">
              <h3 className="font-bold text-white mb-4">Propagate to Fleet</h3>
              <p className="text-sm text-slate-400 mb-4">
                This will push the latest playbook definition to all selected tenants. 
                A rollback snapshot will be taken automatically. High-blast radius operations require idempotency tracking.
              </p>
              
              <button 
                onClick={handlePropagate}
                disabled={propagating}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                {propagating ? <Activity className="w-5 h-5 animate-spin" /> : <Share className="w-5 h-5" />}
                {propagating ? "Propagating..." : "Propagate to All Tenants"}
              </button>

              {propagateResult && (
                <div className={`mt-6 p-4 rounded-lg border ${propagateResult.error ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                  {propagateResult.error ? (
                    <div className="flex gap-2"><AlertTriangle className="w-5 h-5" /> {propagateResult.error}</div>
                  ) : (
                    <div>
                      <div className="flex gap-2 text-emerald-400 font-bold mb-2">
                        <CheckCircle2 className="w-5 h-5" /> 
                        {propagateResult.status === 'idempotent_success' ? 'Idempotency Key Hit' : 'Propagation Complete'}
                      </div>
                      <p className="text-sm text-emerald-300/80">
                        {propagateResult.message || `Successfully deployed to ${propagateResult.successful_deployments} tenants.`}
                      </p>
                      {propagateResult.log && (
                        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                          <Fingerprint className="w-3 h-3" /> Idempotency verified against log ID: {propagateResult.log.id}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audit Log / Safety */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <h3 className="font-bold text-amber-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Fleet Safety
            </h3>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Idempotency Keys</strong> prevent duplicate execution on network retries.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Tenant Filters</strong> ensure playbooks only reach eligible active accounts.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Rollback Snapshots</strong> are captured on the target tenant before modification.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Audit Logs</strong> strictly record the executing operator and partner ID.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
