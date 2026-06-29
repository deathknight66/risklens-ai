'use client'

import { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Server,
  Terminal,
  RotateCcw,
  CheckCircle2,
  Lock,
  Zap,
  PlayCircle,
  AlertTriangle,
  Clock,
  Activity,
  ArrowRight,
  Shield,
  Eye,
  Check,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ActionsPage() {
  const [actions, setActions] = useState<any[]>([])
  const [selectedAction, setSelectedAction] = useState<any>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [modalStep, setModalStep] = useState<"idle" | "simulating" | "executing" | "success" | "failed">("idle")
  const [terminalLogs, setTerminalLogs] = useState<string[]>([])
  const [rollbackStep, setRollbackStep] = useState<"idle" | "executing" | "success" | "failed">("idle")

  const fetchActions = async () => {
    try {
      const res = await fetch('/api/actions')
      const data = await res.json()
      if (data.success) {
        setActions(data.actions)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchActions()
    const interval = setInterval(fetchActions, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleApproveAndExecute = async (actionId: string) => {
    setModalStep("executing")
    setTerminalLogs(["Approving action...", "Sending request to Action Connector..."])
    
    try {
      const res = await fetch('/api/actions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, approvedBy: 'SOC Analyst (Admin)' })
      })
      const data = await res.json()
      
      if (data.success) {
        setTerminalLogs(prev => [...prev, ...data.response.logs, "Execution Successful."])
        setModalStep("success")
      } else {
        setTerminalLogs(prev => [...prev, `ERROR: ${data.error}`])
        setModalStep("failed")
      }
      fetchActions()
    } catch (err) {
      setTerminalLogs(prev => [...prev, `NETWORK ERROR`])
      setModalStep("failed")
    }
  }

  const handleRollback = async (actionId: string) => {
    setRollbackStep("executing")
    setTerminalLogs(["Initiating rollback sequence...", "Contacting connector..."])
    
    try {
      const res = await fetch('/api/actions/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId })
      })
      const data = await res.json()
      
      if (data.success) {
        setTerminalLogs(prev => [...prev, ...data.response.logs, "Rollback Successful."])
        setRollbackStep("success")
      } else {
        setTerminalLogs(prev => [...prev, `ERROR: ${data.error}`])
        setRollbackStep("failed")
      }
      fetchActions()
    } catch (err) {
      setTerminalLogs(prev => [...prev, `NETWORK ERROR`])
      setRollbackStep("failed")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Awaiting Approval': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Executing': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'Executed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Rolled Back': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Failed': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  }

  const renderSimulationPayload = (payloadStr: string | null) => {
    if (!payloadStr) return null;
    try {
      const payload = JSON.parse(payloadStr);
      return (
        <div className="mt-4 p-4 rounded-lg bg-slate-900 border border-slate-700">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Blast Radius Simulation
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Projected Downtime</p>
              <p className="text-sm font-bold text-slate-200">{payload.projectedDowntime}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Blast Radius Score</p>
              <p className="text-sm font-bold text-orange-400">{payload.blastRadius} / 10</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500">Affected Systems</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {payload.affectedSystems?.map((sys: string, i: number) => (
                  <span key={i} className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{sys}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    } catch { return null }
  }

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" /> Autonomous Execution Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">Controlled autonomy with human-in-the-loop gates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ACTION QUEUE */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-400" /> Execution Queue & History
          </h2>
          
          {actions.length === 0 && (
            <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-900/50">
              No pending or historical actions.
            </div>
          )}

          {actions.map(action => (
            <div 
              key={action.id} 
              className={cn(
                "glass p-5 rounded-xl border transition-all cursor-pointer",
                selectedAction?.id === action.id ? "border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "border-slate-700/50 hover:border-slate-600"
              )}
              onClick={() => { setSelectedAction(action); setModalStep("idle"); setRollbackStep("idle"); setTerminalLogs([]) }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800">
                    <Zap className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100">{action.action_type}</h3>
                    <p className="text-xs text-slate-400 font-mono">Target: {action.target}</p>
                  </div>
                </div>
                <span className={cn("text-xs px-3 py-1 rounded-full font-semibold border", getStatusColor(action.status))}>
                  {action.status}
                </span>
              </div>
              <div className="text-sm text-slate-300 mt-2">
                <span className="font-semibold text-slate-400">Reason:</span> {action.reason}
              </div>
            </div>
          ))}
        </div>

        {/* DETAILS & EXECUTION PANEL */}
        <div className="lg:col-span-1">
          <div className="glass rounded-xl border border-slate-700/50 p-6 sticky top-6">
            {!selectedAction ? (
              <div className="text-center text-slate-500 py-12">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Select an action to view details & execution options</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{selectedAction.action_type}</h3>
                  <p className="text-sm text-slate-400">Target: <span className="font-mono text-cyan-400">{selectedAction.target}</span></p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Incident</span>
                    <span className="text-slate-300">{selectedAction.incident_title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Confidence</span>
                    <span className="text-emerald-400 font-bold">{(selectedAction.decision_confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Rollback Status</span>
                    <span className={selectedAction.rollback_expires_at ? "text-emerald-400" : "text-amber-400"}>
                      {selectedAction.rollback_expires_at ? `Expires ${new Date(selectedAction.rollback_expires_at).toLocaleDateString()}` : "Available"}
                    </span>
                  </div>
                </div>

                {selectedAction.status === 'Awaiting Approval' && renderSimulationPayload(selectedAction.simulation_payload)}

                {/* APPROVAL WORKFLOW */}
                {selectedAction.status === 'Awaiting Approval' && (
                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    {modalStep === 'idle' ? (
                      <button 
                        onClick={() => handleApproveAndExecute(selectedAction.id)}
                        className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                      >
                        <Check className="w-5 h-5" /> Approve & Execute
                      </button>
                    ) : (
                      <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-green-400 h-40 overflow-y-auto border border-slate-800">
                        {terminalLogs.map((log, i) => (
                          <div key={i}>{">"} {log}</div>
                        ))}
                        {modalStep === 'executing' && <div className="animate-pulse">{">"} _</div>}
                      </div>
                    )}
                  </div>
                )}

                {/* ROLLBACK WORKFLOW */}
                {selectedAction.status === 'Executed' && (
                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <p className="text-xs text-emerald-400 font-semibold mb-1">Execution Hash</p>
                      <p className="text-[10px] text-slate-400 font-mono break-all">{selectedAction.execution_hash}</p>
                    </div>

                    {rollbackStep === 'idle' ? (
                      <button 
                        onClick={() => handleRollback(selectedAction.id)}
                        className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex justify-center items-center gap-2 border border-slate-600"
                      >
                        <RotateCcw className="w-4 h-4" /> Trigger Rollback
                      </button>
                    ) : (
                      <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-purple-400 h-32 overflow-y-auto border border-slate-800">
                        {terminalLogs.map((log, i) => (
                          <div key={i}>{">"} {log}</div>
                        ))}
                        {rollbackStep === 'executing' && <div className="animate-pulse">{">"} _</div>}
                      </div>
                    )}
                  </div>
                )}
                
                {/* ROLLED BACK STATE */}
                {selectedAction.status === 'Rolled Back' && (
                  <div className="pt-4 border-t border-slate-800">
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg text-center">
                      <RotateCcw className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-purple-400">Successfully Rolled Back</p>
                      <p className="text-xs text-slate-400 mt-1">at {new Date(selectedAction.rolled_back_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
