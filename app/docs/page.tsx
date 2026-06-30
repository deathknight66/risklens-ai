"use client";

import { Shield, BookOpen, Key, Terminal, Code2, Server, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState("authentication");

  return (
    <div className="min-h-screen bg-[#050816]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">RiskLens <span className="text-indigo-400">Docs</span></span>
          </Link>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-2">
              Sign In
            </Link>
            <Link href="/signup" className="text-sm font-medium bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-3">Getting Started</div>
          <DocLink active={activeTab === 'authentication'} onClick={() => setActiveTab('authentication')} icon={Key}>Authentication</DocLink>
          <DocLink active={activeTab === 'rate-limits'} onClick={() => setActiveTab('rate-limits')} icon={Zap}>Rate Limits</DocLink>
          
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 mt-8 px-3">Core APIs</div>
          <DocLink active={activeTab === 'ingest'} onClick={() => setActiveTab('ingest')} icon={Terminal}>POST /api/ingest</DocLink>
          <DocLink active={activeTab === 'analyze'} onClick={() => setActiveTab('analyze')} icon={Server}>POST /api/analyze</DocLink>
          
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 mt-8 px-3">Integrations</div>
          <DocLink active={activeTab === 'cloudflare'} onClick={() => setActiveTab('cloudflare')} icon={Code2}>Cloudflare Logpush</DocLink>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-4xl">
          {activeTab === 'authentication' && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-3xl font-bold text-white mb-2">Authentication</h1>
              <p className="text-slate-400 text-lg">RiskLens AI uses API keys to authenticate requests. You can generate and revoke API keys from your dashboard settings.</p>
              
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-semibold text-slate-200">Bearer Token Format</h3>
                <p className="text-slate-400 text-sm">Pass your API key in the standard Authorization header as a Bearer token, or alternatively using the <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">x-api-key</code> header.</p>
                <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm text-emerald-400 font-mono border border-slate-800">
                  {`Authorization: Bearer rl_YOUR_API_KEY
// OR
x-api-key: rl_YOUR_API_KEY`}
                </pre>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3">
                <Shield className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-sm text-amber-200/80"><strong>Keep your keys secure!</strong> Do not commit them to version control. If a key is compromised, revoke it immediately from the Dashboard.</p>
              </div>
            </div>
          )}

          {activeTab === 'rate-limits' && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-3xl font-bold text-white mb-2">Rate Limits & Quotas</h1>
              <p className="text-slate-400 text-lg">To ensure platform stability, RiskLens enforces rate limits per API key and global quota limits per organization.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">Rate Limiting</h3>
                  <p className="text-slate-400 text-sm mb-4">Requests are capped to prevent DDoS or runaway scripts.</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100 requests per minute per Key</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Returns <code className="text-rose-400">429 Too Many Requests</code></li>
                  </ul>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">Plan Quotas</h3>
                  <p className="text-slate-400 text-sm mb-4">Your subscription plan limits total logs and analyses.</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Billed monthly</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Returns <code className="text-rose-400">402 Payment Required</code></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ingest' && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-3xl font-bold text-white mb-2">POST /api/ingest</h1>
              <p className="text-slate-400 text-lg">Push raw security logs to the RiskLens AI detection engine.</p>
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 text-sm font-mono text-slate-400">
                  Request Payload (JSON)
                </div>
                <pre className="p-4 overflow-x-auto text-sm text-emerald-400 font-mono">
{`{
  "sourceType": "cloudflare_waf",
  "logs": [
    {
      "source_ip": "192.168.1.100",
      "target": "/wp-admin",
      "event_type": "WAF_BLOCK",
      "severity": "HIGH",
      "raw_log": "..."
    }
  ]
}`}
                </pre>
              </div>

              <h3 className="text-lg font-semibold text-white mt-8 mb-4">Response</h3>
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <pre className="p-4 overflow-x-auto text-sm text-indigo-400 font-mono">
{`{
  "success": true,
  "summary": {
    "logsParsed": 1,
    "alertsDetected": 1,
    "incidentsCreated": 1
  }
}`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'cloudflare' && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-3xl font-bold text-white mb-2">Cloudflare Logpush Integration</h1>
              <p className="text-slate-400 text-lg">Stream Cloudflare WAF logs directly into RiskLens AI.</p>
              
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                <p className="text-slate-300">Run the following cURL command to configure a Cloudflare Logpush job pointing to your RiskLens AI workspace.</p>
                
                <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm text-emerald-400 font-mono border border-slate-800">
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
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function DocLink({ children, active, onClick, icon: Icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-indigo-500/10 text-indigo-400' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-500'}`} />
      {children}
    </button>
  );
}
