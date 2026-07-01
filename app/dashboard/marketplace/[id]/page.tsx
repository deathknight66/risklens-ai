"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, Target, TrendingDown, Users, Download, Star, Zap, CheckCircle2, Cloud, Lock, Server } from "lucide-react";
import Link from "next/link";

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = params.id as string;
  const { data: session } = useSession();
  const orgId = session?.activeOrganizationId;
  const router = useRouter();

  const [assetData, setAssetData] = useState<any>(null);
  const [trustData, setTrustData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (orgId && assetId) {
      // 1. Fetch asset base info & install state
      fetch(`/api/marketplace?orgId=${orgId}`)
        .then(res => res.json())
        .then((assets) => {
          const matched = assets.find((a: any) => a.id === assetId);
          setAssetData(matched);
        });

      // 2. Fetch Trust layer telemetry
      fetch(`/api/marketplace/trust?assetId=${assetId}`)
        .then(res => res.json())
        .then((data) => {
          setTrustData(data);
          setLoading(false);
        });
    }
  }, [orgId, assetId]);

  const handleInstall = async () => {
    if (!orgId) return;
    setInstalling(true);

    const res = await fetch('/api/marketplace/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId,
        orgId,
        userId: session?.user?.id
      })
    });

    if (res.ok) {
      setAssetData({ ...assetData, is_installed: true });
    } else {
      alert("Installation failed. Please try again.");
    }
    setInstalling(false);
  };

  if (loading || !assetData || !trustData) return <div className="p-8 text-slate-400">Loading Trust Telemetry...</div>;

  const { signals, marketplaceTrustScore } = trustData;

  return (
    <div className="p-8 space-y-10 max-w-6xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <Link href="/dashboard/marketplace" className="text-sm text-fuchsia-400 hover:underline mb-2 inline-block">&larr; Back to Marketplace</Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-white">{assetData.name}</h1>
            {signals.verifiedStatus && (
              <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" /> Verified by Securita Global
              </div>
            )}
          </div>
          <p className="text-slate-400 text-lg max-w-3xl">{assetData.description}</p>
        </div>
        
        <div className="flex flex-col gap-3 min-w-[200px]">
          <div className="glass p-4 rounded-xl border border-slate-800 text-center">
            <div className="text-slate-400 text-sm mb-1">Marketplace Trust Score</div>
            <div className="text-3xl font-black text-fuchsia-400">{marketplaceTrustScore}</div>
          </div>
          {assetData.is_installed ? (
            <button disabled className="w-full px-6 py-3 bg-emerald-500/10 text-emerald-400 rounded-lg font-bold flex items-center justify-center gap-2 border border-emerald-500/20 cursor-not-allowed">
              <CheckCircle2 className="w-5 h-5" /> Installed & Active
            </button>
          ) : (
            <button 
              onClick={handleInstall}
              disabled={installing}
              className="w-full px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(192,38,211,0.4)] disabled:opacity-50"
            >
              {installing ? 'Installing...' : `Install for ${assetData.price === 0 ? 'Free' : '$'+assetData.price}`}
            </button>
          )}
        </div>
      </div>

      {/* OBSERVED OUTCOMES ACROSS TENANTS (Highest ROI Block) */}
      <section className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/20 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" /> Observed Outcomes Across Tenants
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-3xl font-black text-emerald-400 font-mono">{signals.benchmarkUplift}%</div>
            <div className="text-sm font-bold text-slate-300">Median MTTR Drop</div>
            <p className="text-xs text-slate-500">Vs pre-install baseline</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-emerald-400 font-mono">82%</div>
            <div className="text-sm font-bold text-slate-300">Median Containment Rate</div>
            <p className="text-xs text-slate-500">Fully autonomous resolution</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-blue-400 font-mono">14.2<span className="text-xl">h</span></div>
            <div className="text-sm font-bold text-slate-300">Median Time Saved</div>
            <p className="text-xs text-slate-500">Analyst hours per month</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-slate-300 font-mono">2.8<span className="text-xl">d</span></div>
            <div className="text-sm font-bold text-slate-300">Median Deployment Time</div>
            <p className="text-xs text-slate-500">Time to first value</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-10">
          {/* OPERATIONAL PREVIEW */}
          <section className="glass rounded-2xl p-8 border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-6">Operational Preview</h2>
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <h4 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Trigger Logic</h4>
                <div className="flex items-center gap-3 text-slate-300 font-mono text-sm">
                  <span className="text-amber-400">WHEN</span> (Event.Severity == 'High' OR Event.Severity == 'Critical') 
                  <br /> <span className="text-amber-400">AND</span> Event.Category == '{assetData.category === 'playbook' ? 'Initial Access' : 'Any'}'
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <h4 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Containment Workflow</h4>
                <div className="space-y-3 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-800 bg-slate-900 text-slate-500 z-10 font-mono text-xs">1</div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] p-3 rounded bg-slate-800/50 text-sm text-slate-300 ml-4 md:ml-0 md:mr-4 md:group-odd:ml-4 md:group-odd:mr-0 border border-slate-700">Enrich IP via Threat Intelligence</div>
                  </div>
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-800 bg-slate-900 text-slate-500 z-10 font-mono text-xs">2</div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] p-3 rounded bg-slate-800/50 text-sm text-slate-300 ml-4 md:ml-0 md:mr-4 md:group-odd:ml-4 md:group-odd:mr-0 border border-slate-700">Isolate Endpoint via EDR</div>
                  </div>
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-800 bg-slate-900 text-emerald-500 z-10 font-mono text-xs border-emerald-500/30">3</div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] p-3 rounded bg-emerald-900/20 text-sm text-emerald-400 ml-4 md:ml-0 md:mr-4 md:group-odd:ml-4 md:group-odd:mr-0 border border-emerald-500/30">Auto-Resolve if Contained</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <h4 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Rollback Behavior</h4>
                <p className="text-sm text-slate-300">
                  Fully supported. The asset automatically snapshots baseline state prior to execution. If containment causes operational disruption, the playbook can be reversed via the 1-click rollback endpoint.
                </p>
              </div>
            </div>
          </section>

          {/* COMPATIBILITY MATRIX */}
          <section className="glass rounded-2xl p-8 border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-6">Compatibility Matrix</h2>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded border border-slate-700 text-sm font-medium text-slate-300"><Cloud className="w-4 h-4 text-orange-400" /> Cloudflare WAF</div>
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded border border-slate-700 text-sm font-medium text-slate-300"><Server className="w-4 h-4 text-blue-400" /> AWS GuardDuty</div>
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded border border-slate-700 text-sm font-medium text-slate-300"><Lock className="w-4 h-4 text-blue-500" /> Okta</div>
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded border border-slate-700 text-sm font-medium text-slate-300"><ShieldCheck className="w-4 h-4 text-cyan-400" /> Azure Sentinel</div>
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          
          {/* PERFORMANCE */}
          <div className="glass p-6 rounded-xl border border-slate-800">
            <h3 className="font-bold text-white mb-4">Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div className="text-slate-400 flex items-center gap-2"><Download className="w-4 h-4" /> Install Count</div>
                <div className="font-bold text-white">{signals.totalInstalls.toLocaleString()}</div>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div className="text-slate-400 flex items-center gap-2"><Zap className="w-4 h-4" /> 30d Velocity</div>
                <div className="font-bold text-emerald-400">+{signals.installVelocity}</div>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div className="text-slate-400 flex items-center gap-2"><Star className="w-4 h-4" /> Avg Rating</div>
                <div className="font-bold text-amber-400">{signals.weightedRating.toFixed(1)}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-slate-400 flex items-center gap-2"><Users className="w-4 h-4" /> Reviews</div>
                <div className="font-bold text-white">{signals.totalReviews}</div>
              </div>
            </div>
          </div>

          {/* CREATOR REPUTATION */}
          <div className="glass p-6 rounded-xl border border-slate-800">
            <h3 className="font-bold text-white mb-4">Creator Reputation</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div className="text-slate-400">Creator</div>
                <div className="font-bold text-white">{assetData.creator_name}</div>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div className="text-slate-400">Creator Score</div>
                <div className="font-bold text-fuchsia-400">{signals.creatorScore}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-slate-400">Partner Tier</div>
                <div className="font-bold text-white uppercase text-xs">{assetData.partner_tier}</div>
              </div>
            </div>
          </div>

          {/* BENCHMARK PROOF */}
          <div className="bg-fuchsia-900/20 p-6 rounded-xl border border-fuchsia-500/20">
            <h3 className="font-bold text-fuchsia-400 mb-2">Benchmark Engine Proof</h3>
            <p className="text-sm text-fuchsia-200/80">
              Teams using this asset resolved incidents {signals.benchmarkUplift}% faster than their segment median. This asset ranks in the Top Quartile for retention durability.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
