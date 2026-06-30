"use client";

import { useEffect, useState } from 'react';
import { Shield, Target, Zap, MessageSquare, ArrowRight, Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function DealRoomPage() {
  const { id } = useParams();
  const [intel, setIntel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/deals/${id}/intelligence`)
      .then(res => res.json())
      .then(data => {
        setIntel(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading Deal Intelligence...</div>;
  }

  if (!intel || !intel.deal) {
    return <div className="p-12 text-center text-rose-500">Deal not found or error loading intelligence.</div>;
  }

  const { deal, similarity, referenceMatch, autoresponder, narrative } = intel;

  return (
    <div className="min-h-screen bg-[#050816] text-slate-300 font-sans pb-24 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <Link href="/admin/revenue" className="text-fuchsia-500 hover:text-fuchsia-400 flex items-center gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Revenue Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-fuchsia-500" />
            Deal Room: {deal.company_name}
          </h1>
          <div className="flex gap-4 mt-2">
            <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-sm">{deal.segment}</span>
            <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-sm capitalize">{deal.status.replace('_', ' ')}</span>
            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-sm font-bold">
              ${deal.deal_value_estimate?.toLocaleString() || 0}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Intelligence & Similarity */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Win Narrative (LLM Output) */}
            <div className="glass p-6 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5">
              <h2 className="text-xl font-bold text-fuchsia-400 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" /> Recommended Next Move
              </h2>
              <div className="bg-slate-900/50 p-4 rounded border border-slate-700/50 mb-6">
                <p className="text-lg text-white font-semibold">{narrative.best_next_move}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Why this deal matches</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{narrative.why_this_matches}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Likely Blockers</h3>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-rose-300/80">
                    {narrative.likely_blockers?.map((b: string, i: number) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {/* Reference Matcher */}
            <div className="glass p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" /> Reference Matcher
              </h2>
              {referenceMatch ? (
                <div className="bg-slate-900/50 p-4 rounded border border-emerald-500/20">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-white text-lg">{referenceMatch.company}</div>
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">Strong Match</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">Segment: {referenceMatch.segment}</p>
                  
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Overlapping Stack</h4>
                    <div className="flex gap-2 flex-wrap">
                      {referenceMatch.stack.map((s: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs border border-slate-700">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Outcomes (Metrics JSON)</h4>
                    <pre className="text-xs text-emerald-300 bg-black/50 p-3 rounded">{JSON.stringify(referenceMatch.metrics, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">No strong reference match found for this tech stack yet.</div>
              )}
            </div>

            {/* Objection Autoresponder */}
            <div className="glass p-6 rounded-xl border border-rose-500/20 bg-rose-500/5">
              <h2 className="text-xl font-bold text-rose-400 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Objection Autoresponder
              </h2>
              {autoresponder.length > 0 ? (
                <div className="space-y-4">
                  {autoresponder.map((resp: any, idx: number) => (
                    <div key={idx} className="bg-slate-900/50 p-4 rounded border border-rose-500/20">
                      <div className="text-sm text-rose-300 italic mb-2">"{resp.objection}"</div>
                      <div className="text-sm text-slate-200 mb-3"><span className="font-bold text-fuchsia-400">Strategy:</span> {resp.strategy}</div>
                      <div className="flex gap-2">
                        {resp.docs.map((doc: string, dIdx: number) => (
                          <span key={dIdx} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs border border-slate-700 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-sm">No objections logged yet or no matching playbooks.</div>
              )}
            </div>

          </div>

          {/* Right Column: Deal Details & Metadata */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-xl border border-slate-700/50 bg-slate-800/20">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> Deal Similarity Score
              </h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-indigo-400">{similarity.score}%</span>
                <span className="text-slate-400 pb-1">Confidence</span>
              </div>
              <p className="text-sm text-slate-400">
                Most similar won deal: <span className="font-bold text-slate-300">{similarity.mostSimilarDeal || 'None'}</span>
              </p>
            </div>

            <div className="glass p-6 rounded-xl border border-slate-700/50 bg-slate-800/20">
              <h3 className="font-bold text-white mb-4">Tech Stack JSON</h3>
              <div className="flex gap-2 flex-wrap">
                {JSON.parse(deal.tech_stack_json || '[]').map((s: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs border border-slate-700">{s}</span>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-xl border border-slate-700/50 bg-slate-800/20">
              <h3 className="font-bold text-white mb-4">Procurement Status</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-400">Legal Review</span>
                  <span className={`capitalize font-semibold ${deal.legal_status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>{deal.legal_status}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Security Review</span>
                  <span className={`capitalize font-semibold ${deal.security_review_status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>{deal.security_review_status}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Budget</span>
                  <span className={`capitalize font-semibold ${deal.budget_status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>{deal.budget_status}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Exec Sponsor</span>
                  <span className={`capitalize font-semibold ${deal.exec_sponsor_status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>{deal.exec_sponsor_status}</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
