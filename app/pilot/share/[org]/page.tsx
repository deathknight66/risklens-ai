import { notFound, redirect } from 'next/navigation';
import db from '@/lib/db';
import { verifyPilotToken } from '@/lib/hmac';
import { Shield, Zap, Clock, Lock, Target, Workflow, Briefcase } from 'lucide-react';

export default function ChampionKitPage({ params, searchParams }: { params: { org: string }, searchParams: { sig?: string } }) {
  const { org } = params;
  const sig = searchParams.sig;

  if (!sig || !verifyPilotToken(sig, org)) {
    return <div className="p-12 text-center text-rose-500 bg-black min-h-screen">Invalid or expired secure link.</div>;
  }

  const organization = db.prepare('SELECT name FROM organizations WHERE id = ?').get(org) as any;
  if (!organization) return notFound();

  const metrics = db.prepare('SELECT * FROM pilot_success_metrics WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1').get(org) as any;

  if (!metrics) {
    return <div className="p-12 text-center text-slate-400 bg-black min-h-screen">Pilot data not ready yet.</div>;
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-300 font-sans pb-24">
      <div className="max-w-4xl mx-auto p-8 pt-16">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20">
            <Shield className="w-8 h-8 text-fuchsia-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">RiskLens Pilot Outcomes</h1>
            <p className="text-slate-400 text-lg">Prepared exclusively for {organization.name} Leadership</p>
          </div>
        </div>

        {/* Section: Why Now? */}
        <section className="mb-12 glass p-8 rounded-2xl border border-rose-500/20 bg-rose-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
          <h2 className="text-xl font-bold text-rose-400 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5" /> Why Act Now?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-2">1. Current Risk Posture</p>
              <p className="text-slate-400 text-sm leading-relaxed">Recurring attack clusters are bypassing traditional WAFs. The SOC is spending 4+ hours daily on manual triage of false positives.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-2">2. Operational Leverage</p>
              <p className="text-slate-400 text-sm leading-relaxed">RiskLens autonomously contained {metrics.containment_rate}% of verified threats during the pilot, reducing MTTR by {metrics.mttr_delta_minutes} minutes per incident.</p>
            </div>
          </div>
        </section>

        {/* Section: Pilot ROI Summary */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" /> 14-Day Pilot ROI
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-white mb-1 font-mono">{metrics.incidents_ingested}</div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Incidents Ingested</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-fuchsia-400 mb-1 font-mono">{metrics.containment_rate}%</div>
              <div className="text-xs text-fuchsia-500/70 uppercase font-semibold">Auto-Contained</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-1 font-mono">{metrics.analyst_hours_saved}h</div>
              <div className="text-xs text-emerald-500/70 uppercase font-semibold">Analyst Hours Saved</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-white mb-1 font-mono">{metrics.prevented_escalations}</div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Escalations Prevented</div>
            </div>
          </div>
        </section>

        {/* Section: Security Model Highlights */}
        <section className="mb-12 glass p-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
          <h2 className="text-xl font-bold text-indigo-400 mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5" /> Enterprise Trust Model
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Workflow className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-200">Deterministic Execution (No LLM Hallucinations)</h3>
                <p className="text-sm text-slate-400 mt-1">Playbooks are strict DAGs (Directed Acyclic Graphs). The AI analyzes logs, but mitigation actions are fully deterministic and require your explicitly defined policies.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Shield className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-200">Tenant Isolation & Data Retention</h3>
                <p className="text-sm text-slate-400 mt-1">Data is strictly isolated via ORM scopes. Zero models are trained on your logs. Complete data purge happens within 7 days of contract termination.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Executive Recommendation */}
        <section className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-8 rounded-2xl">
          <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5" /> Executive Summary
          </h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            The 14-day RiskLens pilot successfully demonstrated that autonomous triage can safely reduce MTTR by {metrics.mttr_delta_minutes} minutes per incident without adding risk, thanks to the Approval-Required execution mode. Proceeding with a full deployment is projected to yield high operational leverage for the SOC.
          </p>
          <div className="flex justify-end">
            <a href={`/pilot/report/${org}?sig=${sig}`} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-6 rounded-lg transition-colors shadow-lg shadow-emerald-500/20">
              Generate Formal PDF Report
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
