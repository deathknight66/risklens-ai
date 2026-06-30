"use client";

import { useState } from "react";
import { Cloud, Server, Shield, Terminal, Code2, Copy, Check } from "lucide-react";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("cloudflare");
  const [copied, setCopied] = useState("");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const integrations = [
    { id: "cloudflare", name: "Cloudflare WAF", icon: Cloud, description: "Stream edge firewall events directly to RiskLens" },
    { id: "aws", name: "AWS WAF", icon: Server, description: "Ingest AWS WAF logs via Kinesis Firehose" },
    { id: "sentinel", name: "Azure Sentinel", icon: Shield, description: "Forward Sentinel alerts to RiskLens AI" }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Integrations</h1>
        <p className="text-slate-400 mt-1">Connect your security data sources using our pre-built templates.</p>
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
