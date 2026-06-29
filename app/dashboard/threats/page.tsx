"use client";

import { useState } from "react";
import {
  Shield,
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  Bug,
  Wifi,
  Database,
  Key,
  FileWarning,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Clock,
  Server,
  Activity,
} from "lucide-react";
import { threatAlerts, type ThreatAlert } from "@/lib/mock-data";

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  brute_force: { icon: Key, label: "Brute Force", color: "text-red-400" },
  ddos: { icon: Wifi, label: "DDoS", color: "text-orange-400" },
  sql_injection: { icon: Database, label: "SQL Injection", color: "text-amber-400" },
  malware: { icon: Bug, label: "Malware", color: "text-purple-400" },
  credential_attack: { icon: Key, label: "Credential Attack", color: "text-pink-400" },
  data_exfiltration: { icon: FileWarning, label: "Data Exfiltration", color: "text-cyan-400" },
};

const severityConfig: Record<string, { bg: string; text: string; dot: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  low: { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400" },
};

const statusConfig: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-red-500/10", text: "text-red-400" },
  investigating: { bg: "bg-amber-500/10", text: "text-amber-400" },
  mitigated: { bg: "bg-blue-500/10", text: "text-blue-400" },
  resolved: { bg: "bg-green-500/10", text: "text-green-400" },
};

function ThreatDetailPanel({ threat, onClose }: { threat: ThreatAlert; onClose: () => void }) {
  const typeInfo = typeConfig[threat.type];
  const TypeIcon = typeInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0a0e1a] border-l border-slate-700/50 overflow-y-auto animate-slide-right">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityConfig[threat.severity].bg} ${severityConfig[threat.severity].text}`}>
                  {threat.severity.toUpperCase()}
                </span>
                <span className="text-slate-500 text-sm">{threat.id}</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-100">{typeInfo.label} Attack</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl">✕</button>
          </div>

          {/* Risk Score */}
          <div className="glass rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-2">Risk Score</div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold" style={{ color: threat.riskScore >= 80 ? '#ef4444' : threat.riskScore >= 60 ? '#f97316' : '#f59e0b' }}>
                {threat.riskScore}
              </div>
              <div className="flex-1 bg-slate-800 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${threat.riskScore}%`,
                    background: threat.riskScore >= 80 ? 'linear-gradient(90deg, #ef4444, #dc2626)' : threat.riskScore >= 60 ? 'linear-gradient(90deg, #f97316, #ea580c)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                  }}
                />
              </div>
              <span className="text-slate-400 text-sm">/100</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="glass rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-slate-300">Attack Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-500">Type</div>
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <TypeIcon size={14} className={typeInfo.color} />
                    {typeInfo.label}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Status</div>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[threat.status].bg} ${statusConfig[threat.status].text}`}>
                    {threat.status}
                  </span>
                </div>
                <div>
                  <div className="text-slate-500">Source</div>
                  <div className="text-slate-200 font-mono text-xs">{threat.source}</div>
                </div>
                <div>
                  <div className="text-slate-500">Target</div>
                  <div className="text-slate-200 font-mono text-xs">{threat.target}</div>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Description</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{threat.description}</p>
            </div>

            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Attack Vector</h3>
              <p className="text-sm text-cyan-400 font-mono">{threat.attackVector}</p>
            </div>

            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Affected Systems</h3>
              <div className="flex flex-wrap gap-2">
                {threat.affectedSystems.map((sys) => (
                  <span key={sys} className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-slate-300 font-mono border border-slate-700/50">
                    <Server size={10} className="inline mr-1" />
                    {sys}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
              Investigate
            </button>
            <button className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-lg font-medium text-sm border border-slate-700 hover:border-slate-600 transition-colors">
              Mitigate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThreatsPage() {
  const [selectedThreat, setSelectedThreat] = useState<ThreatAlert | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredThreats = threatAlerts.filter((t) => {
    if (filterSeverity !== "all" && t.severity !== filterSeverity) return false;
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase()) && !t.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const severityCounts = {
    critical: threatAlerts.filter((t) => t.severity === "critical").length,
    high: threatAlerts.filter((t) => t.severity === "high").length,
    medium: threatAlerts.filter((t) => t.severity === "medium").length,
    low: threatAlerts.filter((t) => t.severity === "low").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Threat Detection</h1>
          <p className="text-slate-400 mt-1">Monitor and manage security threats in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-sm text-red-400">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            {threatAlerts.filter(t => t.status === 'active').length} Active Threats
          </span>
        </div>
      </div>

      {/* Severity Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {(["critical", "high", "medium", "low"] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(filterSeverity === sev ? "all" : sev)}
            className={`glass rounded-xl p-4 text-left card-hover ${filterSeverity === sev ? "ring-1 ring-cyan-500/50" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium uppercase ${severityConfig[sev].text}`}>{sev}</span>
              <span className={`w-2.5 h-2.5 rounded-full ${severityConfig[sev].dot}`} />
            </div>
            <div className="text-2xl font-bold text-slate-100">{severityCounts[sev]}</div>
            <div className="text-xs text-slate-500 mt-1">threats detected</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search size={16} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search threats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 placeholder-slate-600"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter size={14} className="text-slate-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 outline-none"
            >
              <option value="all">All Types</option>
              <option value="brute_force">Brute Force</option>
              <option value="ddos">DDoS</option>
              <option value="sql_injection">SQL Injection</option>
              <option value="malware">Malware</option>
              <option value="credential_attack">Credential Attack</option>
              <option value="data_exfiltration">Data Exfiltration</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="investigating">Investigating</option>
              <option value="mitigated">Mitigated</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Threats Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Severity</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">ID</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Source</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Target</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Risk</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Time</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {filteredThreats.map((threat, i) => {
              const typeInfo = typeConfig[threat.type];
              const TypeIcon = typeInfo.icon;
              return (
                <tr
                  key={threat.id}
                  className="border-b border-slate-700/30 hover:bg-slate-800/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedThreat(threat)}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${severityConfig[threat.severity].bg} ${severityConfig[threat.severity].text}`}>
                      {threat.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-mono text-slate-400">{threat.id}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <TypeIcon size={14} className={typeInfo.color} />
                      <span className="text-sm text-slate-300">{typeInfo.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-mono text-slate-400">{threat.source}</td>
                  <td className="py-3 px-4 text-sm font-mono text-slate-400">{threat.target}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${threat.riskScore}%`,
                            background: threat.riskScore >= 80 ? '#ef4444' : threat.riskScore >= 60 ? '#f97316' : threat.riskScore >= 40 ? '#f59e0b' : '#22c55e',
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{threat.riskScore}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statusConfig[threat.status].bg} ${statusConfig[threat.status].text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${threat.status === 'active' ? 'bg-red-400 animate-pulse' : threat.status === 'investigating' ? 'bg-amber-400' : threat.status === 'mitigated' ? 'bg-blue-400' : 'bg-green-400'}`} />
                      {threat.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(threat.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <ChevronRight size={14} className="text-slate-600" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredThreats.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <ShieldAlert size={40} className="mx-auto mb-3 opacity-50" />
            <p>No threats match your filters</p>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedThreat && (
        <ThreatDetailPanel threat={selectedThreat} onClose={() => setSelectedThreat(null)} />
      )}
    </div>
  );
}
