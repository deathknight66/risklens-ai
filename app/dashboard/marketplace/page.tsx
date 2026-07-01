"use client";

import { useEffect, useState } from "react";
import { Store, Download, Star, ShieldCheck, Tag, Target, Clock, Zap, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function MarketplacePage() {
  const { data: session } = useSession();
  const orgId = session?.activeOrganizationId;
  const router = useRouter();

  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    if (orgId) {
      fetch(`/api/marketplace?orgId=${orgId}`)
        .then(res => res.json())
        .then(data => {
          setAssets(data);
          setLoading(false);
        });
    }
  }, [orgId]);

  const handleInstall = async (assetId: string) => {
    if (!orgId) return;
    setInstalling(assetId);

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
      setAssets(assets.map(a => a.id === assetId ? { ...a, is_installed: true, installs: a.installs + 1 } : a));
    } else {
      alert("Installation failed. Please try again.");
    }
    setInstalling(null);
  };

  if (loading) return <div className="p-8 text-slate-400">Loading RiskLens Ecosystem...</div>;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <Store className="w-8 h-8 text-fuchsia-500" />
            Marketplace Ecosystem
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Discover and deploy codified expertise from the world's leading MSSPs and security operators. Instantly upgrade your capabilities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="glass rounded-xl border border-slate-800 flex flex-col hover:border-slate-700 transition-all group overflow-hidden">
            {/* Header / Category color bar */}
            <div className={`h-1 w-full ${asset.category === 'playbook' ? 'bg-indigo-500' : asset.category === 'compliance' ? 'bg-emerald-500' : 'bg-fuchsia-500'}`} />
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="px-2 py-1 bg-slate-800 text-xs font-bold text-slate-300 rounded uppercase tracking-wider flex items-center gap-1">
                  {asset.category === 'playbook' && <Zap className="w-3 h-3" />}
                  {asset.category === 'compliance' && <ShieldCheck className="w-3 h-3" />}
                  {asset.category === 'benchmark_pack' && <Target className="w-3 h-3" />}
                  {asset.category.replace('_', ' ')}
                </div>
                {asset.verified ? (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">
                    <ShieldCheck className="w-3 h-3" /> Verified Partner
                  </div>
                ) : null}
              </div>
              
              <h3 className="text-xl font-bold text-slate-100 mb-2 leading-tight">{asset.name}</h3>
              <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-3">{asset.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-6 pb-6 border-b border-slate-800">
                <div>
                  <div className="text-slate-500 mb-1">Creator</div>
                  <div className="font-medium text-slate-300">{asset.creator_name}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Reputation Score</div>
                  <div className="font-bold text-fuchsia-400 flex items-center gap-1">
                    {asset.ms_score} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1 flex items-center gap-1">
                    <Download className="w-3 h-3" /> Installs
                  </div>
                  <div className="font-medium text-slate-300">{asset.installs}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Rating
                  </div>
                  <div className="font-medium text-amber-400">{asset.rating.toFixed(1)}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="font-bold text-lg text-white">
                  {asset.price === 0 ? 'Free' : `$${asset.price.toFixed(2)}`}
                </div>
                
                {asset.is_installed ? (
                  <button disabled className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded font-medium flex items-center gap-2 cursor-not-allowed">
                    <CheckCircle2 className="w-4 h-4" /> Installed
                  </button>
                ) : (
                  <button 
                    onClick={() => handleInstall(asset.id)}
                    disabled={installing === asset.id}
                    className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {installing === asset.id ? 'Installing...' : 'Install Now'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
