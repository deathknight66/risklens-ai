"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  Clock,
  Target,
  Send,
  Sparkles,
  Bot,
  User,
  Info,
  Server,
  Network,
  History,
  Activity,
  Zap,
  ArrowRight,
  Lock,
  Key,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Check
} from "lucide-react";
import { aiChatMessages } from "@/lib/mock-data";

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return <h3 key={i} className="text-base font-semibold text-slate-100 mt-3">{line.replace("## ", "")}</h3>;
        }
        if (line.startsWith("### ")) {
          return <h4 key={i} className="text-sm font-semibold text-slate-200 mt-2">{line.replace("### ", "")}</h4>;
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return <p key={i} className="font-semibold text-slate-200">{line.replace(/\*\*/g, "")}</p>;
        }
        if (line.startsWith("- ")) {
          return <li key={i} className="ml-4 text-slate-300 list-disc">{line.replace("- ", "")}</li>;
        }
        if (line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. ") || line.startsWith("4. ") || line.startsWith("5. ") || line.startsWith("6. ")) {
          return <li key={i} className="ml-4 text-slate-300 list-decimal">{line.replace(/^\d+\.\s/, "")}</li>;
        }
        if (line.startsWith("|")) {
          return <p key={i} className="text-slate-400 font-mono text-xs">{line}</p>;
        }
        if (line.trim() === "") return <br key={i} />;
        return <p key={i} className="text-slate-400">{line}</p>;
      })}
    </div>
  );
}

function RootCauseNodeTree({ node }: { node: any }) {
  if (!node) return null;
  return (
    <div className="flex flex-col items-center">
      <div className="bg-slate-800/80 border border-slate-600/50 shadow-lg rounded-xl p-4 min-w-[250px] max-w-[300px] relative z-10">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
            {node.type?.replace('_', ' ') || 'NODE'}
          </span>
          {node.confidence && (
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded flex items-center gap-1">
              <Activity size={10} />
              {node.confidence}% Conf
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-slate-200 text-center mt-3">{node.label || node.description}</p>
      </div>
      {node.children && node.children.length > 0 && (
        <>
          <div className="w-px h-8 bg-slate-500/50"></div>
          <div className="flex gap-6 justify-center">
            {node.children.map((child: any, i: number) => (
              <RootCauseNodeTree key={child.id || i} node={child} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const getParsedJSON = (data: any) => {
  if (!data) return null;
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return null; }
  }
  return data;
};

export default function InvestigationPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedInvestigation, setSelectedInvestigation] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(aiChatMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisState, setAnalysisState] = useState<"idle" | "loading" | "analyzing" | "completed">("idle");
  const [similarIncidents, setSimilarIncidents] = useState<any[]>([]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch("/api/incidents");
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
        if (data.length > 0) {
          setSelectedInvestigation((prev: any) => {
            if (!prev) return data[0];
            return data.find((i: any) => i.id === prev.id) || data[0];
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch incidents", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setMessages([...messages, { role: "user" as const, content: chatInput }]);
    setChatInput("");
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: `## Analysis in Progress\n\nI'm analyzing your query: "${chatInput}"\n\n### Preliminary Findings\nBased on the current threat landscape and system telemetry, here's what I've found:\n\n1. 🔍 **Pattern Match**: Query correlates with ${Math.floor(Math.random() * 5 + 2)} known threat patterns\n2. 📊 **Risk Assessment**: Estimated risk level is ${["Medium", "High", "Critical"][Math.floor(Math.random() * 3)]}\n3. ⚡ **Recommended Action**: Further investigation recommended\n\n### Next Steps\n- Review affected system logs\n- Cross-reference with threat intelligence feeds\n- Update incident response plan\n\n*This analysis was generated by RiskLens AI Investigation Engine.*`,
        },
      ]);
      setIsTyping(false);
    }, 2000);
  };

  const checkAndFetchRelated = (incident: any) => {
    if (incident.aiSummary || incident.ai_summary) {
      setAnalysisState("completed");
      fetchSimilarIncidents(incident.id || incident.incidentId);
    } else {
      setAnalysisState("idle");
      setSimilarIncidents([]);
    }
  };

  const fetchSimilarIncidents = async (incidentId: string) => {
    try {
      const res = await fetch("/api/memory/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId })
      });
      const data = await res.json();
      if (data.success) {
        setSimilarIncidents(data.similarIncidents || []);
      }
    } catch (error) {
      console.error("Failed to fetch similar incidents:", error);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedInvestigation) return;
    setAnalysisState("loading");
    
    // Simulate gathering context before analysis
    setTimeout(() => {
       setAnalysisState(prev => prev === "loading" ? "analyzing" : prev);
    }, 1500);

    try {
      await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId: selectedInvestigation.id || selectedInvestigation.incidentId })
      });
      
      setAnalysisState("completed");
      fetchSimilarIncidents(selectedInvestigation.id || selectedInvestigation.incidentId);
      setTimeout(() => {
        fetchIncidents();
        setAnalysisState("idle");
      }, 1000);
      
    } catch (error) {
      console.error("Failed to analyze", error);
      setAnalysisState("idle");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const aiSummary = selectedInvestigation?.aiSummary || selectedInvestigation?.ai_summary;
  const rootCauseTree = getParsedJSON(selectedInvestigation?.rootCauseTree || selectedInvestigation?.root_cause_tree);
  const timelineEvents = getParsedJSON(selectedInvestigation?.timelineEvents || selectedInvestigation?.timeline_json || selectedInvestigation?.attackTimeline);
  const mitreMappings = getParsedJSON(selectedInvestigation?.mitreMappings || selectedInvestigation?.mitre_mappings);
  const attackSummary = selectedInvestigation?.attackSummary || selectedInvestigation?.attack_summary || selectedInvestigation?.rootCause;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Core Intelligence Engine</h1>
        <p className="text-slate-400 mt-1">AI-powered incident investigation and root cause analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Investigation Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Investigation Selector */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Active Investigations</h3>
            {incidents.length === 0 ? (
               <div className="text-sm text-slate-500 py-4">No active investigations found.</div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {incidents.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => { setSelectedInvestigation(inv); checkAndFetchRelated(inv); }}
                    className={`flex-1 min-w-[200px] p-3 rounded-lg border text-left transition-all ${
                      selectedInvestigation?.id === inv.id
                        ? "border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-200">{inv.id}</div>
                    <div className="text-xs text-slate-500 mt-1">Incident {inv.incidentId || inv.id}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Risk: {inv.riskScore || 'High'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedInvestigation && !aiSummary && (
            <div className="glass rounded-xl p-12 flex flex-col items-center justify-center text-center relative overflow-hidden border-cyan-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-teal-500/10 z-0"></div>
              
              <div className="relative z-10 mb-6 bg-cyan-500/20 p-4 rounded-full">
                <Brain className="w-12 h-12 text-cyan-400 animate-pulse" />
              </div>
              
              <h2 className="relative z-10 text-2xl font-bold text-white mb-4">Uncover the Root Cause</h2>
              <p className="relative z-10 text-slate-300 max-w-md mb-8">
                Deploy RiskLens AI to perform an automated deep-dive analysis of this incident. The agent will analyze logs, construct a root cause tree, and map the attacker's timeline.
              </p>
              
              <button
                onClick={handleAnalyze}
                disabled={analysisState !== 'idle'}
                className="relative z-10 group bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white px-8 py-4 rounded-xl font-semibold shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-all flex items-center gap-3 disabled:opacity-80 disabled:cursor-not-allowed"
              >
                {analysisState === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gathering Context...
                  </>
                ) : analysisState === 'analyzing' ? (
                  <>
                    <Brain className="w-5 h-5 animate-pulse text-pink-200" />
                    AI Agent analyzing logs...
                  </>
                ) : analysisState === 'completed' ? (
                  <>
                    <Check className="w-5 h-5 text-green-300" />
                    Analysis Complete
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                    Analyze with AI
                  </>
                )}
              </button>
            </div>
          )}

          {selectedInvestigation && aiSummary && (
            <>
              {/* AI Summary */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-cyan-400" />
                  <h3 className="text-base font-semibold text-slate-100">AI Analysis Summary</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{aiSummary}</p>
                {attackSummary && (
                  <div className="mt-4 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg flex items-start gap-3">
                     <Info size={16} className="text-slate-400 mt-0.5 shrink-0" />
                     <p className="text-xs text-slate-400 leading-relaxed"><span className="font-semibold text-slate-300">Attack Summary: </span>{attackSummary}</p>
                  </div>
                )}
              </div>

              {/* MITRE Mappings */}
              {mitreMappings && (
                <div className="glass rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target size={18} className="text-purple-400" />
                    <h3 className="text-base font-semibold text-slate-100">MITRE ATT&CK Mapping</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(mitreMappings) ? mitreMappings.map((mitre: any, idx: number) => (
                      <span key={idx} className="px-3 py-1.5 bg-slate-800/80 rounded-lg text-xs text-slate-300 font-mono border border-slate-700/50 flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-purple-400" />
                        {typeof mitre === 'string' ? mitre : mitre.technique || mitre.id || JSON.stringify(mitre)}
                      </span>
                    )) : (
                      <span className="text-sm text-slate-400">{JSON.stringify(mitreMappings)}</span>
                    )}
                  </div>
                </div>
              )}

              {/* AI Root Cause Tree */}
              {rootCauseTree && (
                <div className="glass rounded-xl p-6 overflow-x-auto">
                  <div className="flex items-center gap-2 mb-6">
                    <Target size={18} className="text-orange-400" />
                    <h3 className="text-base font-semibold text-slate-100">AI Root Cause Tree</h3>
                  </div>
                  {Array.isArray(rootCauseTree) ? (
                    <div className="flex flex-col gap-4">
                      {rootCauseTree.map((step: any, i: number) => (
                        <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                              {step.type || 'STEP'}
                            </span>
                            {step.confidence && (
                              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded flex items-center gap-1">
                                <Activity size={10} />
                                {step.confidence}% Conf
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-200">{step.label || step.description || JSON.stringify(step)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-center p-4">
                      <RootCauseNodeTree node={rootCauseTree} />
                    </div>
                  )}
                </div>
              )}

              {/* Similar Incidents (Threat Memory) */}
              {similarIncidents.length > 0 && (
                <div className="bg-[#111827] border border-cyan-900/30 p-6 rounded-xl mt-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-cyan-400" />
                      Organizational Threat Memory
                    </h3>
                    <span className="text-xs bg-cyan-900/40 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20">
                      {similarIncidents.length} related pattern{similarIncidents.length > 1 ? 's' : ''} found
                    </span>
                  </div>
                  
                  <div className="space-y-3 relative z-10">
                    {similarIncidents.map((sim, idx) => {
                      const payload = sim.payload || {};
                      const isHighlySimilar = sim.classification === 'highly_similar';
                      
                      return (
                        <div key={idx} className={`p-4 rounded-lg border ${isHighlySimilar ? 'bg-cyan-950/20 border-cyan-700/40' : 'bg-[#0a0e1a] border-slate-800'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-sm text-slate-300">
                              <span className="font-medium text-white">{payload.summary || "Similar Attack Pattern"}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${isHighlySimilar ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-300'}`}>
                                {(sim.hybridScore * 100).toFixed(0)}% Match
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 text-xs mt-3">
                            {payload.recurrence_count > 1 && (
                              <span className="flex items-center gap-1 text-orange-400 bg-orange-950/30 px-2 py-1 rounded">
                                <AlertTriangle className="w-3 h-3" />
                                Pattern seen {payload.recurrence_count} times
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3" />
                              Last seen: {new Date(payload.last_seen || payload.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attack Timeline Reconstruction */}
              {timelineEvents && Array.isArray(timelineEvents) && (
                <div className="glass rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Clock size={18} className="text-teal-400" />
                    <h3 className="text-base font-semibold text-slate-100">Attack Timeline Reconstruction</h3>
                  </div>
                  <div className="relative pl-2">
                    <div className="absolute left-[75px] top-2 bottom-2 w-px bg-slate-700/50" />
                    <div className="space-y-6">
                      {timelineEvents.map((event: any, i: number) => {
                        const sev = event.severity?.toLowerCase() || 'medium';
                        const sevColor = sev === 'critical' ? 'bg-red-400 shadow-red-400/50' : sev === 'high' ? 'bg-orange-400 shadow-orange-400/50' : sev === 'medium' ? 'bg-amber-400 shadow-amber-400/50' : 'bg-green-400 shadow-green-400/50';
                        return (
                          <div key={i} className="flex items-start gap-4 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                            <span className="text-xs font-mono text-slate-400 w-[52px] pt-1.5 shrink-0 text-right">{event.time || event.timestamp || 'N/A'}</span>
                            <div className="relative z-10 pt-1.5">
                              <div className={`w-3 h-3 rounded-full ${sevColor} shadow-[0_0_8px_currentColor]`} />
                            </div>
                            <div className="flex-1 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium text-slate-200">{event.event || event.action || 'Unknown Event'}</p>
                                  {event.details && (
                                    <p className="text-xs text-slate-400 mt-1">{event.details}</p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${
                                    sev === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    sev === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                    sev === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-green-500/10 text-green-400 border border-green-500/20'
                                  }`}>
                                    {sev}
                                  </span>
                                  {event.confidence && (
                                    <span className="text-[10px] text-cyan-400/80 font-mono">
                                      {event.confidence}% Conf
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations fallback if they exist */}
              {selectedInvestigation.recommendation && (
                <div className="glass rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={18} className="text-yellow-400" />
                    <h3 className="text-base font-semibold text-slate-100">One-Click Mitigation</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedInvestigation.recommendation.map((rec: any, i: number) => {
                      let Icon = ShieldAlert;
                      let color = "text-yellow-400";
                      let bg = "bg-yellow-400/10";
                      let border = "border-yellow-400/20";
                      
                      const type = rec.type || '';
                      if (type === 'block_ip') {
                        Icon = Network; color = "text-red-400"; bg = "bg-red-400/10"; border = "border-red-400/20";
                      } else if (type === 'isolate_endpoint') {
                        Icon = Server; color = "text-orange-400"; bg = "bg-orange-400/10"; border = "border-orange-400/20";
                      } else if (type === 'reset_credentials') {
                        Icon = Key; color = "text-cyan-400"; bg = "bg-cyan-400/10"; border = "border-cyan-400/20";
                      } else if (type === 'disable_api_key') {
                        Icon = Lock; color = "text-purple-400"; bg = "bg-purple-400/10"; border = "border-purple-400/20";
                      }

                      return (
                        <button key={i} className={`flex items-center justify-between p-3 rounded-lg border ${border} ${bg} hover:bg-slate-800/80 transition-all text-left group`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md bg-slate-900/50 shadow-inner ${color}`}>
                              <Icon size={16} />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{rec.action}</div>
                              <div className="text-xs text-slate-400 capitalize mt-0.5">{type.replace(/_/g, ' ')}</div>
                            </div>
                          </div>
                          <ArrowRight size={16} className={`${color} opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: AI Chat */}
        <div className="lg:col-span-1">
          <div className="glass rounded-xl flex flex-col h-[calc(100vh-180px)] sticky top-6">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Brain size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">AI Security Assistant</h3>
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_5px_#4ade80]" />
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user" ? "bg-slate-700" : "bg-gradient-to-br from-cyan-500 to-teal-500"
                  }`}>
                    {msg.role === "user" ? <User size={14} className="text-slate-300" /> : <Bot size={14} className="text-white" />}
                  </div>
                  <div className={`max-w-[85%] p-3 rounded-xl ${
                    msg.role === "user"
                      ? "bg-cyan-500/10 border border-cyan-500/20 text-slate-200 text-sm"
                      : "bg-slate-800/50 border border-slate-700/50"
                  }`}>
                    {msg.role === "user" ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <MarkdownContent content={msg.content} />
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 px-4 py-3 rounded-xl">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-900/20 rounded-b-xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about threats..."
                  className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:bg-slate-800 transition-all"
                />
                <button
                  onClick={handleSend}
                  className="p-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg text-white hover:opacity-90 transition-opacity shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

