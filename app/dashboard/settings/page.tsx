"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Shield, Plus, X, Copy, Check, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SOC Analyst");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchInvites = async () => {
    const res = await fetch("/api/invitations");
    if (res.ok) {
      const data = await res.json();
      setInvites(data.invitations);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleInvite = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setInviteLink("");
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteLink(data.inviteLink);
        setEmail("");
        fetchInvites();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;
    try {
      await fetch(`/api/invitations/${id}`, { method: "DELETE" });
      fetchInvites();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Organization Settings</h1>
        <p className="text-slate-400 mt-1">Manage your team and workspace configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-200">Pending Invitations</h2>
            </div>
            <div className="divide-y divide-slate-800/50">
              {invites.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No pending invitations</div>
              ) : (
                invites.map((inv: any) => (
                  <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{inv.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{inv.role}</span>
                        <span className="text-xs text-slate-500">{inv.status}</span>
                      </div>
                    </div>
                    {inv.status === 'pending' && (
                      <button onClick={() => handleRevoke(inv.id)} className="text-slate-500 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Invite Member
            </h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="analyst@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="SOC Analyst">SOC Analyst</option>
                  <option value="Board Member">Board Member</option>
                  <option value="Org Admin">Org Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Invite Link"}
              </button>
            </form>

            {inviteLink && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-xs text-emerald-400 font-medium mb-2">Invitation created! Copy link to share:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300"
                  />
                  <button onClick={copyToClipboard} className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md p-1.5 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
