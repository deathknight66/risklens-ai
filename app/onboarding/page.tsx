"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Copy, Check, Terminal, Loader2, ArrowRight, LifeBuoy, Cloud, Server } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [packData, setPackData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    // Beta Telemetry
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'onboarding_started' })
    }).catch(console.error);
  }, []);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timeInterval: NodeJS.Timeout;

    if (polling) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch("/api/onboarding/status");
          if (res.ok) {
            const data = await res.json();
            if (data.ready) {
              clearInterval(pollInterval);
              setPolling(false);
              setTimeout(() => {
                router.push("/dashboard/soc");
              }, 2000);
            }
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000);

      timeInterval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      clearInterval(pollInterval);
      clearInterval(timeInterval);
    };
  }, [polling, router]);

  const selectPackAndProvision = async (packId: string) => {
    setSelectedPack(packId);
    setStep(2);
    
    try {
      const res = await fetch("/api/onboarding/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId })
      });
      const data = await res.json();
      
      if (data.success) {
        setApiKey(data.apiKey);
        setPackData(data.pack);
        setStep(3);
        setPolling(true); // Start polling after API key is generated
      } else {
        console.error("Setup failed");
        setStep(1);
      }
    } catch (err) {
      console.error(err);
      setStep(1);
    }
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const curlCommand = packData ? `curl -X POST https://api.risklens.ai/ingest \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(packData.samplePayload, null, 2)}'` : '';

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
            <p className="text-slate-400 text-lg">Select an onboarding pack to get started instantly.</p>
          </div>

          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => selectPackAndProvision('cloudflare')} className="text-left bg-slate-900/50 border border-slate-800 p-5 rounded-xl hover:border-indigo-500/50 hover:bg-slate-900 transition-all group">
                <Cloud className="w-6 h-6 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-medium mb-1">Cloudflare WAF</h3>
                <p className="text-xs text-slate-500">Preloaded for web attacks (SQLi, Credential Stuffing).</p>
              </button>
              <button onClick={() => selectPackAndProvision('aws')} className="text-left bg-slate-900/50 border border-slate-800 p-5 rounded-xl hover:border-amber-500/50 hover:bg-slate-900 transition-all group">
                <Server className="w-6 h-6 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-medium mb-1">AWS SecHub</h3>
                <p className="text-xs text-slate-500">Preloaded for IAM anomalies & GuardDuty.</p>
              </button>
              <button onClick={() => selectPackAndProvision('internal_soc')} className="text-left bg-slate-900/50 border border-slate-800 p-5 rounded-xl hover:border-emerald-500/50 hover:bg-slate-900 transition-all group">
                <Shield className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-medium mb-1">Internal SOC</h3>
                <p className="text-xs text-slate-500">Generic behavioral alerts & malware containment.</p>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-slate-400">Provisioning your API keys and autonomous playbooks...</p>
            </div>
          )}

          {step === 3 && packData && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="bg-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  Test your setup
                </h3>
                <p className="text-sm text-slate-400">Run this tailored command in your terminal to inject a simulated {packData.name} attack.</p>
                
                <div className="relative group">
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button onClick={copyToClipboard} className="bg-slate-800 hover:bg-slate-700 text-white rounded px-3 py-1 text-xs transition-colors flex items-center gap-1 font-medium border border-slate-700">
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="bg-slate-950 border border-slate-800 p-4 rounded-lg overflow-x-auto text-xs text-emerald-400 font-mono pt-12">
                    {curlCommand}
                  </pre>
                </div>
              </div>

              <div className="pt-4 flex flex-col items-center justify-center space-y-4">
                {!polling ? (
                  <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 px-6 py-3 rounded-full animate-fade-in border border-emerald-500/20">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Incident generated! Redirecting...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-indigo-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-medium">Waiting for your first log...</span>
                    </div>
                    
                    {isTimeout && (
                      <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-xl max-w-md text-center space-y-3 animate-fade-in">
                        <LifeBuoy className="w-6 h-6 text-slate-400 mx-auto" />
                        <h4 className="text-white font-medium">Having trouble?</h4>
                        <p className="text-sm text-slate-400">Make sure your firewall allows outbound POST requests to RiskLens.</p>
                        <button onClick={() => router.push("/dashboard/soc")} className="text-indigo-400 text-sm hover:text-indigo-300 font-medium flex items-center justify-center gap-1 mx-auto mt-2">
                          Skip to Dashboard <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
