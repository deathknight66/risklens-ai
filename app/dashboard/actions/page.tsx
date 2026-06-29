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
  ArrowRight
} from 'lucide-react'
import {
  autonomousActions,
  actionSimulations,
  executionLogs,
  rollbackLogs,
  approvalWorkflow
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function ActionsPage() {
  const [selectedAction, setSelectedAction] = useState<any>(null)
  const [modalStep, setModalStep] = useState(0) // 0: Preview, 1: Approval, 2: Executing, 3: Completed, 4: Rollback Executing, 5: Rollback Completed
  const [terminalLogs, setTerminalLogs] = useState<string[]>([])
  
  // Terminal animation effect
  useEffect(() => {
    if (modalStep === 2) {
      setTerminalLogs([])
      let i = 0
      const timer = setInterval(() => {
        if (i < executionLogs.length) {
          setTerminalLogs(prev => [...prev, executionLogs[i]])
          i++
        } else {
          clearInterval(timer)
          setTimeout(() => setModalStep(3), 1000)
        }
      }, 800)
      return () => clearInterval(timer)
    }
    
    // Rollback animation
    if (modalStep === 4) {
      setTerminalLogs([])
      let i = 0
      const timer = setInterval(() => {
        if (i < rollbackLogs.length) {
          setTerminalLogs(prev => [...prev, rollbackLogs[i]])
          i++
        } else {
          clearInterval(timer)
          setTimeout(() => setModalStep(5), 1000)
        }
      }, 800)
      return () => clearInterval(timer)
    }
  }, [modalStep])

  const openActionModal = (action: any) => {
    setSelectedAction(action)
    setModalStep(0)
  }

  const handleRollback = (action: any) => {
    setSelectedAction(action)
    setModalStep(4) // Start rollback sequence
  }

  const renderModal = () => {
    if (!selectedAction) return null

    // For demo purposes, we will mock the simulation lookup
    const simulation = actionSimulations.isolate_payment_api 

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="glass-strong rounded-2xl border border-slate-700/60 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Modal Header */}
          <div className="p-5 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">{selectedAction.action}</h3>
                <p className="text-sm text-slate-400 font-mono mt-0.5">Target: {selectedAction.target}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedAction(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto">
            {/* Steps Progress */}
            <div className="flex items-center justify-between mb-8 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-800 -z-10"></div>
              {[
                { label: 'Simulation', step: 0 },
                { label: 'Approval', step: 1 },
                { label: 'Execution', step: 2 },
                { label: 'Verified', step: 3 }
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-2 bg-slate-900 px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                    modalStep > s.step || modalStep === 4 || modalStep === 5 ? 'bg-cyan-500 border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' :
                    modalStep === s.step ? 'bg-slate-800 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse' :
                    'bg-slate-900 border-slate-700 text-slate-500'
                  }`}>
                    {modalStep > s.step || modalStep === 4 || modalStep === 5 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${modalStep >= s.step || modalStep >= 4 ? 'text-slate-200' : 'text-slate-500'}`}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Step 0: Simulation */}
            {modalStep === 0 && (
              <div className="space-y-6 animate-slide-up">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Loss Avoided</p>
                    <p className="text-2xl font-bold text-green-400">${selectedAction.projectedLossAvoided.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Downtime</p>
                    <p className="text-2xl font-bold text-amber-400">{simulation.estimatedDowntimeMinutes} min</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Risk Reduction</p>
                    <p className="text-2xl font-bold text-cyan-400">{simulation.riskReduction}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Confidence</p>
                    <p className="text-2xl font-bold text-blue-400">91%</p>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <h4 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Business Impact Prediction
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Executing this action will temporarily disrupt <strong>{simulation.affectedServices} services</strong>, causing an estimated financial friction of <strong>${simulation.financialImpact.toLocaleString()}</strong>. However, it completely halts propagation, reducing the overall blast radius by <strong>{simulation.blastRadiusReduction}%</strong>.
                  </p>
                </div>
                
                <button 
                  onClick={() => setModalStep(1)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Approval <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 1: Approval */}
            {modalStep === 1 && (
              <div className="space-y-4 animate-slide-up">
                <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                  {approvalWorkflow.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border-b border-slate-800 last:border-0">
                      <div className="flex items-center gap-3">
                        {step.status === 'Completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : step.status === 'Waiting' ? (
                          <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                        ) : (
                          <Lock className="w-5 h-5 text-slate-600" />
                        )}
                        <span className={`text-sm font-medium ${step.status === 'Completed' ? 'text-slate-200' : 'text-slate-400'}`}>
                          {step.stage}
                        </span>
                      </div>
                      <span className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-semibold",
                        step.status === 'Completed' ? "bg-green-500/10 text-green-400" :
                        step.status === 'Waiting' ? "bg-amber-500/10 text-amber-400" :
                        "bg-slate-800 text-slate-500"
                      )}>
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setModalStep(0)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setModalStep(2)}
                    className="flex-[2] py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" /> Approve & Execute Containment
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 & 4: Execution / Rollback Terminal */}
            {(modalStep === 2 || modalStep === 4) && (
              <div className="animate-slide-up">
                <div className="bg-[#0a0a0a] rounded-xl border border-slate-700/50 p-4 font-mono text-sm shadow-inner h-[250px] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800 text-slate-500">
                    <Terminal className="w-4 h-4" /> 
                    <span>{modalStep === 2 ? 'Execution Engine' : 'Rollback Engine'}</span>
                  </div>
                  <div className="space-y-2">
                    {terminalLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-3 text-slate-300 animate-fade-in">
                        <span className="text-cyan-500">{'>'}</span>
                        <span className={log.includes('successfully') ? 'text-green-400' : 'text-slate-300'}>{log}</span>
                      </div>
                    ))}
                    <div className="flex gap-3 text-slate-500 animate-pulse">
                      <span className="text-cyan-500">{'>'}</span>
                      <span className="w-2 h-4 bg-slate-500"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 & 5: Completed */}
            {(modalStep === 3 || modalStep === 5) && (
              <div className="text-center py-8 animate-slide-up">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center border-2 border-green-500/20 mb-4 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">
                  {modalStep === 3 ? 'Action Executed Successfully' : 'Rollback Completed'}
                </h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  {modalStep === 3 
                    ? `The containment policy has been distributed to all edge nodes. Blast radius reduced by ${simulation.blastRadiusReduction}%.`
                    : 'The system has been restored to its previous state. All related dependencies have passed health checks.'}
                </p>
                
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => setSelectedAction(null)}
                    className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                  >
                    Close Panel
                  </button>
                  {modalStep === 3 && selectedAction.rollbackAvailable && (
                    <button 
                      onClick={() => setModalStep(4)}
                      className="px-6 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-400 font-medium transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Execute Rollback
                    </button>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Zap className="w-6 h-6 text-cyan-400" />
            Autonomous Response Layer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Execute, simulate, and rollback security actions across your infrastructure.
          </p>
        </div>
      </div>

      {/* Main Actions Table */}
      <div className="glass rounded-xl overflow-hidden border border-slate-700/50 shadow-xl">
        <div className="p-5 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/30">
          <h2 className="text-lg font-semibold text-slate-100">Action Center & Rollback Engine</h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">1 Pending</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">2 Executed</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 uppercase tracking-wider text-xs border-b border-slate-700/50">
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium">Target Asset</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Risk Reduced</th>
                <th className="p-4 font-medium text-right">Loss Avoided</th>
                <th className="p-4 font-medium text-center">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {autonomousActions.map((action, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-cyan-500/30 transition-colors">
                        <Terminal className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <span className="font-semibold text-slate-200">{action.action}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-slate-400 text-xs">{action.target}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5",
                      action.status === 'Pending Approval' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-green-500/10 text-green-400 border border-green-500/20"
                    )}>
                      {action.status === 'Pending Approval' && <Clock className="w-3 h-3" />}
                      {action.status === 'Executed' && <CheckCircle2 className="w-3 h-3" />}
                      {action.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${action.riskReduction}%` }}></div>
                      </div>
                      <span className="text-cyan-400 font-semibold">{action.riskReduction}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-green-400 font-semibold">
                    ${action.projectedLossAvoided.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    {action.status === 'Pending Approval' ? (
                      <button 
                        onClick={() => openActionModal(action)}
                        className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center gap-1.5 mx-auto"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Execute
                      </button>
                    ) : action.rollbackAvailable ? (
                      <button 
                        onClick={() => handleRollback(action)}
                        className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 mx-auto hover:text-amber-400 hover:border-amber-500/50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Rollback
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Irreversible</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal Overlay */}
      {renderModal()}
      
    </div>
  )
}
