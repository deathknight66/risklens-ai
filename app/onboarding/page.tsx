"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Copy, Check, Terminal, Loader2, ArrowRight, LifeBuoy } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    // Hardening A: One-time API Key reveal
    const storedKey = localStorage.getItem("rl_onboarding_key");
    if (storedKey) {
      setApiKey(storedKey);
      // Remove it so it cannot be accessed again if they refresh
      localStorage.removeItem("rl_onboarding_key");
    }

    // Polling for first log
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/onboarding/status");
        if (res.ok) {
          const data = await res.json();
          if (data.ready) {
            clearInterval(pollInterval);
            setPolling(false);
            // Redirect to dashboard after a short delay for success animation
            setTimeout(() => {
              router.push("/dashboard/soc");
            }, 2000);
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000);

    const timeInterval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timeInterval);
    };
  }, [router]);

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const curlCommand = `curl -X POST https://api.risklens.ai/ingest \\
  -H "Authorization: Bearer ${apiKey || 'rl_YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "source_ip": "192.168.1.100",
    "event_type": "FAILED_LOGIN",
    "target": "admin_portal",
    "severity": "HIGH",
    "raw_log": "Failed password for root from 192.168.1.100 port 22 ssh2"
  }'`;

  // Hardening E: First-log timeout state (5 minutes = 300 seconds)
  const isTimeout = timeElapsed > 300;

  return (
    <div className="min-h-screen bg-[#050816] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0a0e1a] border border-slate-800 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-500/10 blur-[50px] pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
              <Shield className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome to RiskLens AI</h1>
            <p className="text-slate-400 text-lg">Let's connect your first data source.</p>
          </div>

          <div className="space-y-6">
            {/* Step 1: API Key */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl space-y-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="bg-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Save your Ingestion Key
              </h3>
              <p className="text-sm text-slate-400">
                This key allows you to send security logs to your workspace. <span className="text-rose-400 font-medium">It will only be shown once.</span>
              </p>
              
              {apiKey ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={apiKey}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm"
                  />
                  <button onClick={copyToClipboard} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-3 transition-colors flex items-center gap-2 font-medium">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-center text-slate-500 text-sm">
                  Key securely stored or already viewed.
                </div>
              )}
            </div>

            {/* Step 2: Send Log */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl space-y-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="bg-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                Send a test log
              </h3>
              <p className="text-sm text-slate-400">Run this command in your terminal to simulate a security event.</p>
              
              <div className="relative group">
                <div className="absolute top-3 right-3">
                  <Terminal className="w-4 h-4 text-slate-500" />
                </div>
                <pre className="bg-slate-950 border border-slate-800 p-4 rounded-lg overflow-x-auto text-xs text-emerald-400 font-mono">
                  {curlCommand}
                </pre>
              </div>
            </div>

            {/* Step 3: Waiting */}
            <div className="pt-4 flex flex-col items-center justify-center space-y-4">
              {!polling ? (
                <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 px-6 py-3 rounded-full animate-fade-in border border-emerald-500/20">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Signal received! Redirecting...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-indigo-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Listening for telemetry...</span>
                  </div>
                  
                  {isTimeout && (
                    <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-xl max-w-md text-center space-y-3 animate-fade-in">
                      <LifeBuoy className="w-6 h-6 text-slate-400 mx-auto" />
                      <h4 className="text-white font-medium">Need help integrating?</h4>
                      <p className="text-sm text-slate-400">It seems we haven't received any logs yet. Check your firewall settings or view our documentation.</p>
                      <button onClick={() => router.push("/dashboard/soc")} className="text-indigo-400 text-sm hover:text-indigo-300 font-medium flex items-center justify-center gap-1 mx-auto mt-2">
                        Skip for now <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
