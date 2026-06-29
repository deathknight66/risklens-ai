"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Eye,
  Plus,
  Filter,
  Search,
  Calendar,
  AlertTriangle,
  Shield,
  BarChart3,
  Clock,
  CheckCircle,
  FileWarning,
  Sparkles,
} from "lucide-react";
import { reports, type Report } from "@/lib/mock-data";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  incident: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  compliance: { icon: Shield, color: "text-blue-400", bg: "bg-blue-500/10" },
  executive: { icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/10" },
};

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  draft: { icon: FileWarning, color: "text-amber-400", bg: "bg-amber-500/10", label: "Draft" },
  generated: { icon: Sparkles, color: "text-cyan-400", bg: "bg-cyan-500/10", label: "Generated" },
  approved: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", label: "Approved" },
};

function ReportPreview({ report, onClose }: { report: Report; onClose: () => void }) {
  const typeInfo = typeConfig[report.type];
  const TypeIcon = typeInfo.icon;
  const statusInfo = statusConfig[report.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#0a0e1a] border border-slate-700/50 rounded-2xl overflow-hidden animate-scale-in shadow-2xl">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 ${typeInfo.bg} rounded-xl flex items-center justify-center`}>
                <TypeIcon size={20} className={typeInfo.color} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">{report.title}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.label}</span>
                  <span className="text-xs text-slate-500">{report.id}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg">✕</button>
          </div>

          {/* Report Details */}
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Type</span>
                <p className="text-slate-200 capitalize mt-0.5">{report.type} Report</p>
              </div>
              <div>
                <span className="text-slate-500">Created</span>
                <p className="text-slate-200 mt-0.5">{new Date(report.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
              </div>
              <div>
                <span className="text-slate-500">Severity</span>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs ${
                  report.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                  report.severity === 'high' ? 'bg-orange-500/10 text-orange-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>{report.severity}</span>
              </div>
              <div>
                <span className="text-slate-500">Status</span>
                <p className={`mt-0.5 ${statusInfo.color} text-sm`}>{statusInfo.label}</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Summary</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{report.summary}</p>
          </div>

          {/* Preview Content (Simulated) */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Report Preview</h3>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/30">
              <div className="h-3 bg-slate-700/50 rounded w-3/4" />
              <div className="h-3 bg-slate-700/50 rounded w-full" />
              <div className="h-3 bg-slate-700/50 rounded w-5/6" />
              <div className="h-3 bg-slate-700/50 rounded w-2/3" />
              <div className="my-4 h-32 bg-slate-700/30 rounded-lg flex items-center justify-center border border-slate-700/30">
                <BarChart3 size={32} className="text-slate-600" />
              </div>
              <div className="h-3 bg-slate-700/50 rounded w-full" />
              <div className="h-3 bg-slate-700/50 rounded w-4/5" />
              <div className="h-3 bg-slate-700/50 rounded w-3/4" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
              <Download size={16} />
              Download PDF
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-lg font-medium text-sm border border-slate-700 hover:border-slate-600 transition-colors">
              <Eye size={16} />
              Full Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReports = reports.filter((r) => {
    if (filterType !== "all" && r.type !== filterType) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reports</h1>
          <p className="text-slate-400 mt-1">Generate and manage security reports</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
          <Plus size={16} />
          Generate Report
        </button>
      </div>

      {/* Report Type Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(["incident", "compliance", "executive"] as const).map((type) => {
          const config = typeConfig[type];
          const Icon = config.icon;
          const count = reports.filter((r) => r.type === type).length;
          return (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? "all" : type)}
              className={`glass rounded-xl p-4 text-left card-hover ${filterType === type ? "ring-1 ring-cyan-500/50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={20} className={config.color} />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-100">{count}</div>
                  <div className="text-xs text-slate-400 capitalize">{type} Reports</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 placeholder-slate-600"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.map((report, i) => {
          const typeInfo = typeConfig[report.type];
          const TypeIcon = typeInfo.icon;
          const statusInfo = statusConfig[report.status];
          const StatusIcon = statusInfo.icon;

          return (
            <div
              key={report.id}
              className="glass rounded-xl p-5 card-hover cursor-pointer animate-slide-up"
              style={{ animationDelay: `${i * 0.08}s` }}
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${typeInfo.bg} rounded-xl flex items-center justify-center`}>
                  <TypeIcon size={20} className={typeInfo.color} />
                </div>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                  <StatusIcon size={12} />
                  {statusInfo.label}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-slate-100 mb-2 leading-snug">{report.title}</h3>
              <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">{report.summary}</p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    report.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                    report.severity === 'high' ? 'bg-orange-500/10 text-orange-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>{report.severity}</span>
                  <span className="text-xs text-slate-500 capitalize">{report.type}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar size={12} />
                  {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredReports.length === 0 && (
        <div className="glass rounded-xl py-16 text-center">
          <FileText size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">No reports match your search</p>
        </div>
      )}

      {/* Report Preview Modal */}
      {selectedReport && <ReportPreview report={selectedReport} onClose={() => setSelectedReport(null)} />}
    </div>
  );
}
