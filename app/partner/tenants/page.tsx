"use client";

import { useEffect, useState } from "react";
import { Building2, ArrowRight, Shield } from "lucide-react";

export default function TenantManagement() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/partner/dashboard?partnerId=securita-global')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-12 text-slate-400">Loading Tenants...</div>;
  if (data.error) return <div className="p-12 text-rose-500">Error: {data.error}</div>;

  const { tenants } = data;

  const handleEnterWorkspace = (orgId: string, orgName: string) => {
    alert(`Entering delegated workspace for ${orgName}. Your session context is now scoped to org_id=${orgId} with delegated partner permissions.`);
    // In a real app, this would redirect to `/admin` but with the session augmented 
    // to include activeOrganizationId = orgId and orgAccessMode = "delegated".
  };

  return (
    <div className="p-8 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-fuchsia-500" />
          Tenant Management
        </h1>
        <p className="text-slate-400">Manage your connected organizations and enter their workspaces.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((t: any) => (
          <div key={t.id} className="glass p-6 rounded-xl border border-slate-700/50 bg-slate-800/20 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{t.name}</h3>
                <p className="text-xs font-mono text-slate-500 mt-1">{t.slug}</p>
              </div>
              <Shield className={`w-6 h-6 ${t.healthScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>

            <div className="space-y-3 mb-6 flex-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Health Score</span>
                <span className="text-slate-200 font-bold">{t.healthScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Incidents Contained</span>
                <span className="text-slate-200 font-bold">{t.incidentsContained}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Contract End</span>
                <span className="text-slate-200">{new Date(t.contractEnd).toLocaleDateString()}</span>
              </div>
            </div>

            <button 
              onClick={() => handleEnterWorkspace(t.id, t.name)}
              className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Enter Workspace <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
        {tenants.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-500 border border-dashed border-slate-700 rounded-xl">
            No active tenants managed.
          </div>
        )}
      </div>
    </div>
  );
}
