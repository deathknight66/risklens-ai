"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Shield, Plus, X, Copy, Check, Trash2, Key, KeyRound } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SOC Analyst");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  
  const [keys, setKeys] = useState([]);
  const [keyScope, setKeyScope] = useState("ingest_only");
  const [keyLoading, setKeyLoading] = useState(false);
  const [newKey, setNewKey] = useState("");

  const [exportFormat, setExportFormat] = useState("csv");
  const [exportTarget, setExportTarget] = useState("incidents");

  const [idp, setIdp] = useState<any>(null);
  const [ssoDomain, setSsoDomain] = useState("");
  const [ssoProviderType, setSsoProviderType] = useState("okta");
  const [ssoMetadataUrl, setSsoMetadataUrl] = useState("");
  const [ssoLoading, setSsoLoading] = useState(false);

  const fetchInvites = async () => {
    const res = await fetch("/api/invitations");
    if (res.ok) {
      const data = await res.json();
      setInvites(data.invitations);
    }
  };

  const fetchKeys = async () => {
    const res = await fetch("/api/keys");
    if (res.ok) {
      const data = await res.json();
      setKeys(data);
    }
  };

  const fetchIdp = async () => {
    const res = await fetch("/api/sso/config");
    if (res.ok) {
      const data = await res.json();
      if (data.id) {
        setIdp(data);
        setSsoDomain(data.domain);
        setSsoProviderType(data.provider_type);
        setSsoMetadataUrl(data.metadata_url || "");
      }
    }
  };

  useEffect(() => {
    fetchInvites();
    fetchKeys();
    fetchIdp();
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

  const handleGenerateKey = async (e: any) => {
    e.preventDefault();
    setKeyLoading(true);
    setNewKey("");
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: keyScope }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewKey(data.rawKey);
        fetchKeys();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
    setKeyLoading(false);
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This will break integrations using it.")) return;
    try {
      await fetch(`/api/keys/${id}`, { method: "DELETE" });
      fetchKeys();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyKeyToClipboard = () => {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    window.location.href = `/api/export?target=${exportTarget}&format=${exportFormat}`;
  };

  const handleSaveSSO = async (e: any) => {
    e.preventDefault();
    setSsoLoading(true);
    try {
      const res = await fetch("/api/sso/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: ssoDomain, providerType: ssoProviderType, metadataUrl: ssoMetadataUrl }),
      });
      if (res.ok) {
        fetchIdp();
        alert("SSO Configuration saved successfully!");
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
    setSsoLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
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

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-200">API Keys</h2>
            </div>
            <div className="divide-y divide-slate-800/50">
              {keys.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No active API keys</div>
              ) : (
                keys.map((key: any) => (
                  <div key={key.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <KeyRound className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{key.id}</p>
                        <div className="flex gap-2 mt-1 items-center">
                          <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{key.scope}</span>
                          <span className="text-xs text-slate-500">
                            Last used: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleRevokeKey(key.id)} className="text-slate-500 hover:text-rose-400 transition-colors text-sm flex items-center gap-1">
                      Revoke
                    </button>
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

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              Generate API Key
            </h2>
            <form onSubmit={handleGenerateKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Scope</label>
                <select
                  value={keyScope}
                  onChange={(e) => setKeyScope(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="ingest_only">Ingest Only</option>
                  <option value="admin_full">Admin Full</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={keyLoading}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
              >
                {keyLoading ? "Generating..." : "Generate Key"}
              </button>
            </form>

            {newKey && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-xs text-emerald-400 font-medium mb-2">Key generated! Copy now, it won't be shown again:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={newKey}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300 font-mono"
                  />
                  <button onClick={copyKeyToClipboard} className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md p-1.5 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Copy className="w-5 h-5 text-emerald-400" />
              Audit Export
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Target Resource</label>
                <select
                  value={exportTarget}
                  onChange={(e) => setExportTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="incidents">Incidents</option>
                  <option value="actions">Mitigation Actions</option>
                  <option value="auth_logs">Authentication Logs</option>
                  <option value="usage_metering">Usage Metering</option>
                  <option value="invoices">Invoices</option>
                  <option value="reports">Executive Reports</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="csv">CSV (Spreadsheet)</option>
                  <option value="json">JSON (Raw Data)</option>
                </select>
              </div>
              <button
                onClick={handleExport}
                className="w-full bg-emerald-500/10 border border-emerald-500/50 hover:bg-emerald-500 text-emerald-400 hover:text-white font-medium rounded-lg px-4 py-2 transition-colors"
              >
                Download Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise SSO Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-200">Enterprise Single Sign-On (SAML)</h2>
          <p className="text-sm text-slate-400 mt-1">Configure your Identity Provider to allow users to authenticate automatically via SSO.</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleSaveSSO} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Company Domain</label>
                <input
                  type="text"
                  required
                  value={ssoDomain}
                  onChange={(e) => setSsoDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="acme.com"
                />
                <p className="text-xs text-slate-500 mt-1">Users with this domain will be routed to your IdP.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Provider</label>
                <select
                  value={ssoProviderType}
                  onChange={(e) => setSsoProviderType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="okta">Okta</option>
                  <option value="entra">Microsoft Entra ID</option>
                  <option value="google">Google Workspace</option>
                  <option value="other">Other SAML 2.0</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Metadata URL</label>
                <input
                  type="url"
                  value={ssoMetadataUrl}
                  onChange={(e) => setSsoMetadataUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="https://idp.example.com/metadata.xml"
                />
                <p className="text-xs text-slate-500 mt-1">Link to your IdP's XML metadata.</p>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={ssoLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                >
                  {ssoLoading ? "Saving..." : "Save Identity Provider Settings"}
                </button>
              </div>
            </div>
          </form>

          {idp && (
            <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-400">SSO is active for {idp.domain}</p>
                <p className="text-xs text-slate-400 mt-1">Your users can now log in using the SSO portal or SCIM.</p>
              </div>
              <div className="px-3 py-1 bg-indigo-500/20 rounded-full text-indigo-300 text-xs font-semibold">Active</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
