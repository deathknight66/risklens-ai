"use client";

import { useState, useEffect } from "react";
import { Cloud, Server, Shield, Terminal, Code2, Copy, Check, Send, AlertTriangle, Activity, Trash2, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("destinations");
  const [copied, setCopied] = useState("");
  const [destinations, setDestinations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newDest, setNewDest] = useState({ name: "", type: "slack", webhookUrl: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [destRes, logRes] = await Promise.all([
        fetch("/api/destinations"),
        fetch("/api/delivery_logs")
      ]);
      const destData = await destRes.json();
      const logData = await logRes.json();
      
      if (destData.destinations) setDestinations(destData.destinations);
      if (logData.logs) setLogs(logData.logs);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleAddDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDest)
      });
      if (res.ok) {
        setIsAdding(false);
        setNewDest({ name: "", type: "slack", webhookUrl: "" });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add");
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this destination? Policies using it will fail to notify.")) return;
    try {
      const res = await fetch(`/api/destinations/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const integrations = [
    { id: "destinations", name: "Outbound Destinations", icon: Send, description: "Manage Slack, Teams, PagerDuty" },
    { id: "cloudflare", name: "Cloudflare WAF", icon: Cloud, description: "Stream edge firewall events directly to RiskLens" },
    { id: "aws", name: "AWS WAF", icon: Server, description: "Ingest AWS WAF logs via Kinesis Firehose" },
    { id: "sentinel", name: "Azure Sentinel", icon: Shield, description: "Forward Sentinel alerts to RiskLens AI" }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Integrations</h1>
        <p className="text-slate-400 mt-1">Connect your security data sources and alert destinations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          {integrations.map((integration) => (
            <button
              key={integration.id}
              onClick={() => setActiveTab(integration.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeTab === integration.id 
                  ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400" 
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <integration.icon className={`w-5 h-5 ${activeTab === integration.id ? "text-indigo-400" : "text-slate-500"}`} />
              <span className="font-medium text-sm text-left">{integration.name}</span>
            </button>
          ))}
        </div>

        <div className="md:col-span-3">
          {activeTab === "destinations" && (
            <div className="space-y-6">
              {/* Destinations List */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Send className="w-5 h-5 text-indigo-400" /> Webhook Destinations
                    </h2>
                    <p className="text-sm text-slate-400">Configure outbound notifications for automated policies.</p>
                  </div>
                  {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add Destination
                    </button>
                  )}
                </div>

                {isAdding && (
                  <form onSubmit={handleAddDestination} className="bg-slate-950 border border-slate-800 p-4 rounded-xl mb-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
                        <input required type="text" value={newDest.name} onChange={e => setNewDest({...newDest, name: e.target.value})} placeholder="e.g. SOC #alerts channel" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                        <select required value={newDest.type} onChange={e => setNewDest({...newDest, type: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500">
                          <option value="slack">Slack Incoming Webhook</option>
                          <option value="teams">Microsoft Teams Webhook</option>
                          <option value="pagerduty">PagerDuty Integration Key</option>
                          <option value="jira">Jira Automation Webhook</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Webhook URL / Key</label>
                      <input required type="text" value={newDest.webhookUrl} onChange={e => setNewDest({...newDest, webhookUrl: e.target.value})} placeholder="https://hooks.slack.com/services/..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200">Cancel</button>
                      <button type="submit" disabled={saving} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                      </button>
                    </div>
                  </form>
                )}

                {loading ? (
                  <div className="flex justify-center p-8 text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : destinations.length === 0 && !isAdding ? (
                  <div className="text-center p-8 text-slate-500 bg-slate-950 rounded-xl border border-slate-800/50 border-dashed">
                    No destinations configured. Click "Add Destination" to setup Slack, Teams, or PagerDuty.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {destinations.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-200">{d.name}</h3>
                            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded uppercase">{d.type}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-mono truncate max-w-md">{d.webhook_url.substring(0, 30)}...</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <button onClick={() => handleDelete(d.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-2"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery Health */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" /> Delivery Health
                  </h2>
                  <p className="text-sm text-slate-400">Real-time status of automated outbound alerts.</p>
                </div>
                
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-800/50 text-slate-300">
                    <tr>
                      <th className="px-6 py-4 font-medium">Timestamp</th>
                      <th className="px-6 py-4 font-medium">Destination</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Response / Next Retry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {logs.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center">No recent deliveries</td></tr>
                    ) : logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-200">{log.destination_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          {log.status === 'success' && <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-xs font-medium"><Check className="w-3 h-3" /> SUCCESS</span>}
                          {log.status === 'retrying' && <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded text-xs font-medium"><Loader2 className="w-3 h-3 animate-spin" /> RETRYING ({log.attempts})</span>}
                          {log.status === 'failed' && <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-400/10 px-2 py-1 rounded text-xs font-medium"><AlertTriangle className="w-3 h-3" /> FAILED</span>}
                          {log.status === 'sending' && <span className="inline-flex items-center gap-1 text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded text-xs font-medium"><Loader2 className="w-3 h-3 animate-spin" /> SENDING</span>}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-xs font-mono text-slate-500">
                          {log.provider_response || (log.next_retry_at ? `Next retry: ${new Date(log.next_retry_at).toLocaleTimeString()}` : '-')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "cloudflare" && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                <div className="w-12 h-12 bg-[#F38020]/10 rounded-xl flex items-center justify-center border border-[#F38020]/20">
                  <Cloud className="w-6 h-6 text-[#F38020]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Cloudflare Logpush</h2>
                  <p className="text-sm text-slate-400">Stream WAF events in near real-time.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  cURL Setup Command
                </h3>
                <p className="text-sm text-slate-400">Run this command in your terminal. Replace the placeholders with your Cloudflare Zone ID and RiskLens API Key.</p>
                
                <div className="relative group">
                  <pre className="bg-slate-950 border border-slate-800 p-4 rounded-lg overflow-x-auto text-xs text-emerald-400 font-mono">
{`curl -s -X POST 'https://api.cloudflare.com/client/v4/zones/<YOUR_ZONE_ID>/logpush/jobs' \\
-H "X-Auth-Email: <CLOUDFLARE_EMAIL>" \\
-H "X-Auth-Key: <CLOUDFLARE_API_KEY>" \\
-H "Content-Type: application/json" \\
-d '{
  "name": "RiskLens AI WAF Integration",
  "logpull_options": "fields=ClientIP,ClientRequestHost,ClientRequestMethod,ClientRequestURI,EdgeResponseStatus,WAFRuleMessage",
  "destination_conf": "https://api.risklens.ai/api/ingest?header_x-api-key=rl_YOUR_API_KEY",
  "dataset": "firewallEvents",
  "enabled": true
}'`}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard("curl...", "cf_curl")}
                    className="absolute top-2 right-2 p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {copied === "cf_curl" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "aws" && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                <div className="w-12 h-12 bg-[#FF9900]/10 rounded-xl flex items-center justify-center border border-[#FF9900]/20">
                  <Server className="w-6 h-6 text-[#FF9900]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">AWS WAF via Kinesis</h2>
                  <p className="text-sm text-slate-400">Forward AWS WAF logs using Firehose HTTP endpoint.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  Terraform Template
                </h3>
                <p className="text-sm text-slate-400">Deploy this Kinesis Firehose delivery stream.</p>
                
                <div className="relative group">
                  <pre className="bg-slate-950 border border-slate-800 p-4 rounded-lg overflow-x-auto text-xs text-emerald-400 font-mono">
{`resource "aws_kinesis_firehose_delivery_stream" "risklens_stream" {
  name        = "risklens-waf-logs"
  destination = "http_endpoint"

  http_endpoint_configuration {
    url                = "https://api.risklens.ai/api/ingest"
    name               = "RiskLens AI"
    access_key         = "rl_YOUR_API_KEY"
    buffering_size     = 1
    buffering_interval = 60
    role_arn           = aws_iam_role.firehose_role.arn
    s3_backup_mode     = "FailedDataOnly"
  }
}`}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard("terraform...", "aws_tf")}
                    className="absolute top-2 right-2 p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {copied === "aws_tf" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sentinel" && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                <div className="w-12 h-12 bg-[#0078D4]/10 rounded-xl flex items-center justify-center border border-[#0078D4]/20">
                  <Shield className="w-6 h-6 text-[#0078D4]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Azure Sentinel</h2>
                  <p className="text-sm text-slate-400">Push Sentinel incidents to RiskLens AI.</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm">Configure an Azure Logic App with an HTTP POST action pointing to <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">https://api.risklens.ai/api/ingest</code> using the <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">x-api-key</code> header.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
