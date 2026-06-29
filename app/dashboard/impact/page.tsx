"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingDown,
  Database,
  ShieldAlert,
  Target,
  Server,
  Network,
  Activity,
  Users,
  Zap,
  Shield,
  History,
} from "lucide-react";
import { businessImpacts, RiskPropagationNode, scenarioComparisons } from "@/lib/mock-data";

const PropagationNode = ({ node }: { node: RiskPropagationNode }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'compromised': return 'border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      case 'at_risk': return 'border-orange-500/50 bg-orange-500/10 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]';
      case 'safe': return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
      default: return 'border-slate-500/50 bg-slate-500/10 text-slate-400';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server size={16} />;
      case 'database': return <Database size={16} />;
      case 'api': return <Network size={16} />;
      case 'business_process': return <Activity size={16} />;
      default: return <Server size={16} />;
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`flex items-center gap-3 p-3 rounded-xl border bg-slate-900 ${getStatusStyle(node.status)} min-w-[200px] z-10 relative overflow-hidden group`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="p-2 bg-black/40 rounded-lg">
          {getIcon(node.type)}
        </div>
        <div>
          <div className="text-sm font-bold tracking-wide">{node.label}</div>
          <div className="text-xs font-mono opacity-80 flex items-center gap-1 mt-0.5">
            <TrendingDown size={12} />
            ${node.lossPerHour.toLocaleString()}/hr
          </div>
        </div>
        {node.status === 'compromised' && (
          <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 animate-pulse m-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
        )}
      </div>
      
      {node.children && node.children.length > 0 && (
        <>
          <div className="w-px h-8 bg-slate-600"></div>
          <div className="flex justify-center">
            {node.children.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === node.children!.length - 1;
              const isOnly = node.children!.length === 1;

              return (
                <div key={child.id} className="relative flex flex-col items-center px-4">
                  {!isOnly && (
                    <div className="absolute top-0 h-px bg-slate-600" style={{
                      left: isFirst ? '50%' : '0',
                      right: isLast ? '50%' : '0'
                    }}></div>
                  )}
                  <div className="absolute top-0 left-1/2 w-px h-8 bg-slate-600 -translate-x-1/2"></div>
                  <div className="pt-8">
                    <PropagationNode node={child} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default function ImpactPage() {
  const [activeScenario, setActiveScenario] = useState(businessImpacts[0]);
  const [activeSimulation, setActiveSimulation] = useState<any>(null);

  return (
    <div className="space-y-6 animate-fade-in p-2">
      {/* Boardroom Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">Business Risk Engine</h1>
          <p className="text-slate-400 mt-1 font-medium tracking-wide">Real-time financial impact & blast radius analysis</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
          {businessImpacts.map((scenario, idx) => (
            <button
              key={idx}
              onClick={() => { setActiveScenario(scenario); setActiveSimulation(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeScenario.category === scenario.category 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
              }`}
            >
              {scenario.category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Risk Propagation Tree */}
        <div className="lg:col-span-8 glass rounded-2xl p-6 border border-slate-700/50 shadow-2xl relative overflow-hidden flex flex-col min-h-[450px]">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5"></div>
          <div className="relative z-10 flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Zap size={20} className="text-cyan-400" />
              Cyber Domino Effect
            </h3>
            <div className="flex gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span> Compromised
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span> At Risk
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Safe
              </span>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative z-10 overflow-x-auto pb-8">
            {activeScenario.propagationTree ? (
               <PropagationNode node={activeScenario.propagationTree} />
            ) : (
               <div className="text-slate-500 flex flex-col items-center gap-3">
                 <ShieldAlert size={48} className="opacity-20" />
                 <p className="font-medium text-sm">No propagation data for this scenario</p>
               </div>
            )}
          </div>
        </div>

        {/* Widgets Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Financial Loss Engine */}
          <div className="glass rounded-2xl p-6 border border-slate-700/50 shadow-2xl relative overflow-hidden group flex-1">
            <div className="absolute inset-0 bg-gradient-to-bl from-red-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-lg font-semibold text-slate-100 mb-5 flex items-center gap-2 relative z-10">
              <DollarSign size={20} className="text-red-400" />
              Financial Loss Engine
            </h3>
            
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 transition-colors hover:bg-slate-800">
                <span className="text-sm text-slate-400">Direct Loss</span>
                <span className="font-mono text-slate-200 font-medium">${activeScenario.lossEngine.directLoss.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 transition-colors hover:bg-slate-800">
                <span className="text-sm text-slate-400">Downtime Cost</span>
                <span className="font-mono text-slate-200 font-medium">${activeScenario.lossEngine.downtimeCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 transition-colors hover:bg-slate-800">
                <span className="text-sm text-slate-400">SLA Penalties</span>
                <span className="font-mono text-slate-200 font-medium">${activeScenario.lossEngine.slaPenalty.toLocaleString()}</span>
              </div>
              
              <div className="mt-6 pt-5 border-t border-slate-700/80">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-slate-300 font-medium uppercase tracking-wider">Total Estimated</span>
                  <span className="text-3xl font-bold text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)] font-mono">
                    ${(activeSimulation ? activeSimulation.loss : activeScenario.lossEngine.totalEstimated).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Blast Radius Calculator */}
          <div className="glass rounded-2xl p-6 border border-slate-700/50 shadow-2xl relative overflow-hidden group flex-1">
             <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
             <h3 className="text-lg font-semibold text-slate-100 mb-5 flex items-center gap-2 relative z-10">
              <Target size={20} className="text-orange-400" />
              Blast Radius Calculator
            </h3>
            
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-inner">
                <Server size={22} className="text-blue-400" />
                <div className="text-2xl font-bold text-slate-100">{activeScenario.blastRadius.systems}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Systems</div>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-inner">
                <Users size={22} className="text-purple-400" />
                <div className="text-2xl font-bold text-slate-100">{activeScenario.blastRadius.users.toLocaleString()}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Users</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-inner">
                <Database size={22} className="text-emerald-400" />
                <div className="text-2xl font-bold text-slate-100">{activeScenario.blastRadius.databases}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Databases</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-inner">
                <Network size={22} className="text-amber-400" />
                <div className="text-2xl font-bold text-slate-100">{activeScenario.blastRadius.apis}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">APIs</div>
              </div>
            </div>
          </div>
          
          {/* What-If Simulator */}
          <div className="glass rounded-2xl p-6 border border-slate-700/50 shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
             <h3 className="text-lg font-semibold text-slate-100 mb-5 flex items-center gap-2 relative z-10">
              <Zap size={20} className="text-purple-400" />
              What-If Simulator
            </h3>
            
            <div className="relative z-10 w-full overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700/80 text-slate-400 uppercase tracking-wider text-xs">
                    <th className="pb-3 font-medium">Scenario</th>
                    <th className="pb-3 font-medium text-right">Loss</th>
                    <th className="pb-3 font-medium text-right">Downtime</th>
                    <th className="pb-3 font-medium text-center">Assets Hit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {scenarioComparisons.map((sim, idx) => {
                    const isActive = activeSimulation ? activeSimulation.scenario === sim.scenario : false;
                    return (
                      <tr 
                        key={idx} 
                        onClick={() => setActiveSimulation(sim)}
                        className={`cursor-pointer transition-all hover:bg-slate-800/40 ${
                          isActive ? 'bg-cyan-500/10' : ''
                        }`}
                      >
                        <td className="py-3 px-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-transparent'}`}></span>
                            <span className={`font-medium ${isActive ? 'text-cyan-300' : 'text-slate-300'}`}>
                              {sim.scenario}
                            </span>
                          </div>
                        </td>
                        <td className={`py-3 px-1 text-right font-mono ${isActive ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                          ${sim.loss.toLocaleString()}
                        </td>
                        <td className={`py-3 px-1 text-right ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>{sim.downtime}</td>
                        <td className={`py-3 px-1 text-center font-mono ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>{sim.assetsHit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Loss Correlation (Threat Memory) */}
          <div className="glass rounded-2xl p-6 border border-purple-500/30 shadow-2xl relative overflow-hidden group bg-purple-900/10">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2 flex items-center gap-2 relative z-10">
              <History className="w-5 h-5 text-purple-400" />
              Historical Loss Correlation
            </h3>
            <p className="text-sm text-slate-300 relative z-10 mb-4">
              Based on <span className="font-bold text-purple-300">4 similar past incidents</span> found in Threat Memory.
            </p>
            <div className="relative z-10 grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Average Loss</div>
                <div className="text-xl font-bold text-red-400">$84,500</div>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Max Recorded</div>
                <div className="text-xl font-bold text-red-500">$142,000</div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Mitigation Status Card */}
      <div className="glass rounded-2xl p-6 border border-slate-700/50 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
               <Shield className="text-emerald-400" size={24} />
            </div>
            <div>
               <h4 className="text-slate-100 font-semibold text-lg">Recommended Action</h4>
               <p className="text-slate-400 text-sm mt-1 max-w-2xl">Execute automated isolation playbook to contain the threat and prevent further lateral movement across the network.</p>
            </div>
         </div>
         <div className="sm:text-right shrink-0">
            <div className="text-sm text-slate-400 mb-1">Estimated Mitigation Cost</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">${activeScenario.mitigationCost.toLocaleString()}</div>
         </div>
      </div>
    </div>
  );
}
