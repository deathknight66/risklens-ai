"use client";

import { useState, useEffect } from "react";
import { GitGraph, PlayCircle, Lock, Activity, CheckCircle2, XCircle, Clock, Search, Workflow, ChevronRight } from "lucide-react";

export default function PlaybooksPage() {
  const [activeTab, setActiveTab] = useState("playbooks");
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [locks, setLocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "playbooks") {
        const res = await fetch("/api/playbooks");
        const json = await res.json();
        if (json.playbooks) setPlaybooks(json.playbooks);
      } else if (activeTab === "runs") {
        const res = await fetch("/api/playbooks/runs");
        const json = await res.json();
        if (json.runs) setRuns(json.runs);
      } else if (activeTab === "locks") {
        const res = await fetch("/api/playbooks/locks");
        const json = await res.json();
        if (json.locks) setLocks(json.locks);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleApprove = async (runId: string) => {
    try {
      const res = await fetch("/api/playbooks/runs/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId })
      });
      if (res.ok) {
        fetchData(); // Refresh the runs list
      } else {
        const json = await res.json();
        alert(json.error || "Failed to approve run");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving playbook run");
    }
  };

  const navItems = [
    { id: "playbooks", name: "DAG Templates", icon: GitGraph },
    { id: "runs", name: "Execution History", icon: PlayCircle },
    { id: "locks", name: "Resource Locks", icon: Lock }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Workflow className="w-6 h-6 text-fuchsia-400" /> Autonomous Playbooks
          </h1>
          <p className="text-slate-400 mt-1">Multi-step mitigation sequences, branching logic, and rollback states.</p>
        </div>
        <button className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Create DAG Playbook
        </button>
      </div>

      <div className="flex border-b border-slate-700/50 mb-6">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === item.id 
                ? "border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
            }`}
          >
            <item.icon className="w-4 h-4" /> {item.name}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-12 text-slate-500"><Activity className="w-6 h-6 animate-spin" /></div>
        ) : (
          <>
            {activeTab === "playbooks" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playbooks.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-500 border border-slate-700/50 border-dashed rounded-xl">
                    No playbooks created yet.
                  </div>
                ) : playbooks.map(pb => (
                  <div key={pb.id} className="glass p-5 rounded-xl border border-slate-700/50 hover:border-fuchsia-500/50 transition-colors group cursor-pointer flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-slate-100">{pb.name}</h3>
                        <div className="flex gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${pb.execution_mode === 'fully_autonomous' ? 'bg-fuchsia-500/10 text-fuchsia-400' : 'bg-slate-500/10 text-slate-400'}`}>
                            {pb.execution_mode === 'fully_autonomous' ? 'Auto' : pb.execution_mode === 'approval_required' ? 'Approval' : 'Suggest'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${pb.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                            {pb.is_active ? 'Active' : 'Draft'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">{pb.description}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-700/50 pt-4">
                      <div className="text-xs text-slate-500 font-mono">ID: {pb.id.substring(0, 8)}...</div>
                      <div className="text-fuchsia-400 text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Edit DAG <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "runs" && (
              <div className="glass rounded-xl border border-slate-700/50 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-800/50 text-slate-300">
                    <tr>
                      <th className="px-6 py-4 font-medium">Run ID</th>
                      <th className="px-6 py-4 font-medium">Playbook</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Started At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {runs.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center border-none">No execution history found.</td></tr>
                    ) : runs.map(r => (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer">
                        <td className="px-6 py-4 font-mono text-xs">{r.id.substring(0,12)}</td>
                        <td className="px-6 py-4 text-slate-200">{r.playbook_name}</td>
                        <td className="px-6 py-4">
                          {r.status === 'completed' && <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-xs flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> Completed</span>}
                          {r.status === 'failed' && <span className="text-rose-400 bg-rose-400/10 px-2 py-1 rounded text-xs flex items-center gap-1 w-fit"><XCircle className="w-3 h-3"/> Failed</span>}
                          {r.status === 'rolled_back' && <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded text-xs flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> Rolled Back</span>}
                          {r.status === 'running' && <span className="text-fuchsia-400 bg-fuchsia-400/10 px-2 py-1 rounded text-xs flex items-center gap-1 w-fit"><Activity className="w-3 h-3 animate-pulse"/> Running</span>}
                          {r.status === 'suggested' && <span className="text-slate-400 bg-slate-400/10 px-2 py-1 rounded text-xs flex items-center gap-1 w-fit"><GitGraph className="w-3 h-3"/> Suggested</span>}
                          {r.status === 'pending_approval' && (
                            <div className="flex items-center gap-2">
                              <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded text-xs flex items-center gap-1 w-fit"><Lock className="w-3 h-3"/> Pending Approval</span>
                              <button onClick={(e) => { e.stopPropagation(); handleApprove(r.id); }} className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-2 py-1 rounded">
                                Approve
                              </button>
                            </div>
                          )}
                          {r.status === 'expired' && <span className="text-slate-500 bg-slate-500/10 px-2 py-1 rounded text-xs flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> Expired</span>}
                        </td>
                        <td className="px-6 py-4">{new Date(r.started_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "locks" && (
              <div className="glass rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Lock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">Active Resource Locks</h2>
                    <p className="text-sm text-slate-400">Prevents concurrent playbooks from mutating the same target simultaneously.</p>
                  </div>
                </div>
                
                {locks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border border-slate-700/50 border-dashed rounded-xl">
                    No active resource locks. Systems are idle.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locks.map((lock: any) => (
                      <div key={lock.target} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                        <div className="font-mono text-sm text-amber-400 mb-2 truncate" title={lock.target}>{lock.target}</div>
                        <div className="text-xs text-slate-500 space-y-1">
                          <div>Run ID: <span className="text-slate-300">{lock.run_id.substring(0, 10)}...</span></div>
                          <div>Expires: <span className="text-slate-300">{new Date(lock.expires_at).toLocaleTimeString()}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
