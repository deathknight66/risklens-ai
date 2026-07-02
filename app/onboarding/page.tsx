"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Shield, Target, Server, Cloud, Lock, Plus, ArrowRight, Zap, CheckCircle2, TrendingUp, Download, PlayCircle, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function OnboardingWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const orgId = session?.activeOrganizationId;

  const [step, setStep] = useState(0);

  // State
  const [intent, setIntent] = useState<string | null>(null);
  const [stack, setStack] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<string[]>([]);
  const [customIncident, setCustomIncident] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<any | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationLog, setSimulationLog] = useState<any[]>([]);
  const [simulationMetrics, setSimulationMetrics] = useState<any>(null);
  const [countdown, setCountdown] = useState(24 * 60 * 60);

  const intents = [
    "Reduce alert fatigue",
    "Speed up containment",
    "Improve SLA compliance",
    "Prepare for board reporting",
    "Standardize analyst workflows",
    "Increase MSSP client capacity"
  ];

  const stacks = [
    { id: "aws", name: "AWS", icon: <Server className="w-6 h-6 text-amber-400" /> },
    { id: "cloudflare", name: "Cloudflare", icon: <Cloud className="w-6 h-6 text-orange-400" /> },
    { id: "okta", name: "Okta", icon: <Lock className="w-6 h-6 text-blue-500" /> },
    { id: "google_workspace", name: "Google Workspace", icon: <Cloud className="w-6 h-6 text-blue-400" /> },
    { id: "microsoft", name: "Microsoft", icon: <Server className="w-6 h-6 text-cyan-500" /> }
  ];

  const incidentTemplates = [
    "Phishing", "Credential stuffing", "Impossible travel", "MFA fatigue",
    "Privilege escalation", "Token abuse", "Suspicious OAuth grants", "Data exfiltration"
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 5) {
      timer = setInterval(() => setCountdown(prev => prev > 0 ? prev - 1 : 0), 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const toggleIncident = (inc: string) => {
    if (incidents.includes(inc)) {
      setIncidents(incidents.filter(i => i !== inc));
    } else {
      if (incidents.length < 3) setIncidents([...incidents, inc]);
    }
  };

  const addCustomIncident = () => {
    if (customIncident.trim() && incidents.length < 3 && !incidents.includes(customIncident.trim())) {
      setIncidents([...incidents, customIncident.trim()]);
      setCustomIncident("");
    }
  };

  const fetchRecommendations = async () => {
    setStep(3); // Move to loading state for step 3
    const res = await fetch("/api/onboarding/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stack, incidents, activation_intent: intent, orgId })
    });
    if (res.ok) {
      const data = await res.json();
      setRecommendations(data.recommendations);
    }
  };

  const runSimulation = async (playbook: any) => {
    setSelectedPlaybook(playbook);
    setStep(4);
    setSimulationActive(true);
    setSimulationLog([]);

    const res = await fetch("/api/onboarding/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playbookId: playbook.id, orgId, incidents })
    });

    if (res.ok) {
      const data = await res.json();
      
      // Reveal logs one by one for effect
      let currentLog = 0;
      const interval = setInterval(() => {
        if (currentLog < data.execution_log.length) {
          setSimulationLog(prev => [...prev, data.execution_log[currentLog]]);
          currentLog++;
        } else {
          clearInterval(interval);
          setSimulationMetrics(data.metrics);
          setSimulationActive(false);
        }
      }, 800);
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#050816] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#0a0e1a] border border-slate-800 rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-500/10 blur-[50px] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 text-center mb-10">
          <div className="flex justify-center items-center gap-2 mb-2 text-indigo-400 font-bold uppercase tracking-wider text-xs">
            {step === 0 && "Step 0: Outcome Intent"}
            {step === 1 && "Step 1: Stack Selection"}
            {step === 2 && "Step 2: Threat Mapping"}
            {step === 3 && "Step 3: Playbook Architecture"}
            {step === 4 && "Step 4: Dry-Run ACE"}
            {step === 5 && "Step 5: Go Live"}
          </div>
          <h1 className="text-3xl font-black text-white">
            {step === 0 && "What are you trying to improve first?"}
            {step === 1 && "Select your primary environment"}
            {step === 2 && "Select your top 3 repetitive incidents"}
            {step === 3 && "Recommended Autonomous Playbooks"}
            {step === 4 && "Simulating Autonomous Containment"}
            {step === 5 && "Tracker: Your First ACE"}
          </h1>
          <div className="mt-6 flex justify-center gap-2">
            {[0,1,2,3,4,5].map(s => (
              <div key={s} className={`h-1.5 w-12 rounded-full ${s <= step ? 'bg-indigo-500' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>

        <div className="relative z-10 min-h-[400px]">
          
          {/* STEP 0: Outcome Intent */}
          {step === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              {intents.map(i => (
                <button
                  key={i}
                  onClick={() => { setIntent(i); setStep(1); }}
                  className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/10 text-left transition-all group flex items-center justify-between"
                >
                  <span className="text-white font-medium group-hover:text-indigo-300">{i}</span>
                  <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400" />
                </button>
              ))}
            </div>
          )}

          {/* STEP 1: Stack Selection */}
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
              {stacks.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setStack(s.id); setStep(2); }}
                  className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-amber-500 hover:bg-amber-500/10 text-center transition-all flex flex-col items-center gap-3"
                >
                  {s.icon}
                  <span className="text-white font-medium">{s.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2: Top 3 Incidents */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center text-slate-400 mb-6">Select up to 3 incidents. Selected: {incidents.length}/3</div>
              <div className="flex flex-wrap justify-center gap-3">
                {incidentTemplates.map(inc => (
                  <button
                    key={inc}
                    onClick={() => toggleIncident(inc)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                      incidents.includes(inc) 
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {incidents.includes(inc) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    {inc}
                  </button>
                ))}
              </div>
              <div className="max-w-md mx-auto pt-4 border-t border-slate-800 mt-6">
                <div className="text-sm text-slate-400 mb-2">Or add your own:</div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={customIncident}
                    onChange={(e) => setCustomIncident(e.target.value)}
                    placeholder="e.g. AWS IAM brute force"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    onKeyDown={(e) => e.key === 'Enter' && addCustomIncident()}
                  />
                  <button 
                    onClick={addCustomIncident}
                    disabled={!customIncident.trim() || incidents.length >= 3}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-center pt-8">
                <button 
                  onClick={fetchRecommendations}
                  disabled={incidents.length === 0}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                >
                  Generate Playbooks <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Recommended Playbooks */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              {recommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p>Synthesizing Marketplace Intelligence...</p>
                </div>
              ) : (
                <>
                  <div className="text-center text-emerald-400 bg-emerald-500/10 py-3 rounded-lg border border-emerald-500/20 mb-8 font-medium">
                    Expected TTFV based on your intent: First autonomous resolution in under 30 minutes.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((p, idx) => (
                      <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col relative overflow-hidden group">
                        {idx === 0 && <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 text-[10px] font-black px-2 py-1 rounded-bl-lg">TOP MATCH</div>}
                        <h3 className="font-bold text-white mb-1">{p.name}</h3>
                        <p className="text-xs text-slate-400 mb-4 line-clamp-2">{p.description}</p>
                        
                        <div className="bg-slate-950 rounded p-3 mb-4 space-y-2 border border-slate-800/50 flex-1">
                          {p.verified && (
                            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                              <ShieldCheck className="w-3 h-3" /> Verified by Securita Global
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-fuchsia-400" /> MTTR Impact:</span>
                            <span className="font-mono text-fuchsia-400">{p.expected_mttr_improvement_mins}m</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1"><Download className="w-3 h-3 text-blue-400" /> Velocity:</span>
                            <span className="font-mono text-blue-400">+{p.installs} installs</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => runSimulation(p)}
                          className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 font-bold text-sm rounded border border-emerald-500/30 flex items-center justify-center gap-2 transition-all"
                        >
                          <PlayCircle className="w-4 h-4" /> Simulate Dry-Run
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 4: Simulation Run */}
          {step === 4 && (
            <div className="animate-fade-in space-y-8">
              <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Shield className="w-8 h-8 text-fuchsia-500" />
                    {simulationActive && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-fuchsia-400 rounded-full animate-ping" />}
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Dry Run Execution Target</div>
                    <div className="font-bold text-white">{selectedPlaybook?.name}</div>
                  </div>
                </div>
                {simulationActive && (
                  <div className="text-fuchsia-400 flex items-center gap-2 text-sm font-bold bg-fuchsia-500/10 px-3 py-1 rounded-full border border-fuchsia-500/20">
                    <Loader2 className="w-4 h-4 animate-spin" /> Engine Active
                  </div>
                )}
              </div>

              {/* Log Pipeline */}
              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-4 before:translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                {simulationLog.map((log, i) => (
                  <div key={i} className="relative flex items-center animate-fade-in-up">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-700 bg-slate-900 text-slate-500 z-10 text-xs shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="ml-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700 w-full flex justify-between items-center">
                      <div>
                        <div className="text-xs text-slate-500 font-mono mb-1">Step {log.step}</div>
                        <div className="text-sm font-bold text-slate-200">{log.action}</div>
                      </div>
                      <div className="text-xs font-mono text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded">+{log.duration_ms}ms</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Metrics Result */}
              {simulationMetrics && (
                <div className="bg-gradient-to-r from-emerald-900/40 to-blue-900/40 border border-emerald-500/30 p-6 rounded-xl animate-fade-in text-center shadow-[0_0_30px_rgba(16,185,129,0.15)] mt-8">
                  <h3 className="text-xl font-black text-white mb-6">Containment Successful</h3>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div>
                      <div className="text-3xl font-black text-emerald-400 font-mono">{simulationMetrics.simulated_mttr_saved_mins}m</div>
                      <div className="text-sm text-emerald-200/70">MTTR Saved</div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-emerald-400 font-mono">${simulationMetrics.estimated_cost_avoided_usd}</div>
                      <div className="text-sm text-emerald-200/70">Cost Avoided</div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-emerald-400 font-mono">{simulationMetrics.analyst_time_reclaimed_hrs}h</div>
                      <div className="text-sm text-emerald-200/70">Analyst Time Reclaimed</div>
                    </div>
                  </div>
                  <button onClick={() => setStep(5)} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors">
                    Deploy Playbook & Enter Dashboard
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: First Live Trigger Tracker */}
          {step === 5 && (
            <div className="animate-fade-in flex flex-col items-center justify-center space-y-8 py-10">
              <div className="text-center space-y-4">
                <div className="text-5xl font-black text-white font-mono tracking-widest bg-slate-900 px-8 py-4 rounded-xl border border-slate-800 shadow-inner">
                  {formatTime(countdown)}
                </div>
                <div className="text-lg text-slate-400 font-medium">Target: First Autonomous Containment Event (ACE)</div>
              </div>

              <div className="w-full max-w-md bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Telemetry Connected
                  </div>
                  <span className="text-xs text-slate-500 font-mono">OK</span>
                </div>
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Playbooks Armed
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{recommendations.length} Active</span>
                </div>
                <div className="p-4 flex items-center justify-between bg-amber-500/10">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" /> Waiting for First Incident
                  </div>
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => router.push("/dashboard/soc")} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors">
                  Go to SOC Dashboard
                </button>
                <button onClick={() => router.push("/dashboard/marketplace")} className="px-6 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 rounded-lg font-medium transition-colors">
                  Explore Marketplace
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
