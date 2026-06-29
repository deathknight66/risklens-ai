"use client";

import {
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Clock,
  Database,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  ZAxis,
  PieChart,
  Pie,
} from "recharts";
import { businessImpacts, riskMatrixData } from "@/lib/mock-data";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e293b] border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-sm text-slate-200 font-medium">{label || payload[0]?.payload?.category}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-xs text-slate-400">
            {entry.name}: <span className="text-slate-200">{typeof entry.value === 'number' && entry.name?.includes('Loss') ? `$${entry.value.toLocaleString()}` : entry.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const totalFinancialLoss = businessImpacts.reduce((sum, b) => sum + b.financialLoss, 0);
const totalRecords = businessImpacts.reduce((sum, b) => sum + b.dataRecordsAffected, 0);
const totalDowntime = businessImpacts.reduce((sum, b) => sum + b.downtimeHours, 0);
const avgReputation = Math.round(businessImpacts.reduce((sum, b) => sum + b.reputationScore, 0) / businessImpacts.length);
const totalMitigation = businessImpacts.reduce((sum, b) => sum + b.mitigationCost, 0);

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
const sortedImpacts = [...businessImpacts].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

const financialChartData = businessImpacts.map((b) => ({
  category: b.category.split(' ').slice(0, 3).join(' '),
  'Financial Loss': b.financialLoss,
  'Mitigation Cost': b.mitigationCost,
}));

const priorityDistribution = [
  { name: 'Critical', value: businessImpacts.filter(b => b.priority === 'critical').length, color: '#ef4444' },
  { name: 'High', value: businessImpacts.filter(b => b.priority === 'high').length, color: '#f97316' },
  { name: 'Medium', value: businessImpacts.filter(b => b.priority === 'medium').length, color: '#f59e0b' },
  { name: 'Low', value: businessImpacts.filter(b => b.priority === 'low').length, color: '#22c55e' },
];

export default function ImpactPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Business Impact Analysis</h1>
        <p className="text-slate-400 mt-1">Quantify cyber risk in business terms</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass rounded-xl p-4 card-hover animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
              <DollarSign size={16} className="text-red-400" />
            </div>
            <span className="text-xs text-slate-500">Total Financial Risk</span>
          </div>
          <div className="text-2xl font-bold text-red-400">${(totalFinancialLoss / 1000000).toFixed(2)}M</div>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight size={12} className="text-red-400" />
            <span className="text-xs text-red-400">+15% vs last month</span>
          </div>
        </div>

        <div className="glass rounded-xl p-4 card-hover animate-slide-up stagger-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Database size={16} className="text-orange-400" />
            </div>
            <span className="text-xs text-slate-500">Records at Risk</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">{(totalRecords / 1000).toFixed(1)}K</div>
          <span className="text-xs text-slate-500">across all incidents</span>
        </div>

        <div className="glass rounded-xl p-4 card-hover animate-slide-up stagger-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <Clock size={16} className="text-amber-400" />
            </div>
            <span className="text-xs text-slate-500">Total Downtime</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{totalDowntime}h</div>
          <span className="text-xs text-slate-500">business hours lost</span>
        </div>

        <div className="glass rounded-xl p-4 card-hover animate-slide-up stagger-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <TrendingDown size={16} className="text-purple-400" />
            </div>
            <span className="text-xs text-slate-500">Reputation Score</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{avgReputation}/100</div>
          <div className="flex items-center gap-1 mt-1">
            <ArrowDownRight size={12} className="text-red-400" />
            <span className="text-xs text-red-400">-8 points</span>
          </div>
        </div>

        <div className="glass rounded-xl p-4 card-hover animate-slide-up stagger-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <ShieldAlert size={16} className="text-green-400" />
            </div>
            <span className="text-xs text-slate-500">Mitigation Cost</span>
          </div>
          <div className="text-2xl font-bold text-green-400">${(totalMitigation / 1000).toFixed(0)}K</div>
          <span className="text-xs text-slate-500">{Math.round((totalMitigation / totalFinancialLoss) * 100)}x less than risk</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Impact Chart */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-cyan-400" />
            Financial Impact vs Mitigation Cost
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={financialChartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Financial Loss" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.8} />
              <Bar dataKey="Mitigation Cost" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-3">
            <span className="flex items-center gap-2 text-xs text-slate-400"><span className="w-3 h-3 bg-red-500 rounded" /> Financial Loss</span>
            <span className="flex items-center gap-2 text-xs text-slate-400"><span className="w-3 h-3 bg-green-500 rounded" /> Mitigation Cost</span>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Target size={18} className="text-orange-400" />
            Risk Priority
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={priorityDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {priorityDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {priorityDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  {item.name}
                </span>
                <span className="text-slate-200 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Matrix */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-400" />
          Risk Priority Matrix
        </h3>
        <div className="grid grid-cols-6 gap-1">
          {/* Y-axis label */}
          <div className="flex items-center justify-center">
            <span className="text-xs text-slate-500 -rotate-90 whitespace-nowrap">Impact →</span>
          </div>
          {/* Matrix grid */}
          <div className="col-span-5">
            <div className="grid grid-cols-5 gap-1">
              {[5, 4, 3, 2, 1].map((impact) =>
                [1, 2, 3, 4, 5].map((likelihood) => {
                  const risk = riskMatrixData.find(
                    (r) => r.impact === impact && r.likelihood === likelihood
                  );
                  const riskLevel = impact * likelihood;
                  const bgColor = riskLevel >= 15 ? 'bg-red-500/20 border-red-500/30' : riskLevel >= 8 ? 'bg-orange-500/15 border-orange-500/25' : riskLevel >= 4 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-green-500/10 border-green-500/20';
                  return (
                    <div
                      key={`${impact}-${likelihood}`}
                      className={`aspect-square rounded-lg ${bgColor} border flex items-center justify-center p-1 relative group`}
                    >
                      {risk && (
                        <>
                          <span className="text-[10px] text-center leading-tight text-slate-300">{risk.label}</span>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-slate-700">
                            {risk.label}: {impact}×{likelihood}={riskLevel}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-between mt-2 px-1">
              {[1, 2, 3, 4, 5].map((l) => (
                <span key={l} className="text-xs text-slate-500">{l}</span>
              ))}
            </div>
            <div className="text-center mt-1">
              <span className="text-xs text-slate-500">Likelihood →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Details Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-base font-semibold text-slate-100">Detailed Impact Assessment</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Category</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Priority</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">Financial Loss</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">Records</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">Downtime</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">Reputation</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Compliance Risk</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">Mitigation Cost</th>
              </tr>
            </thead>
            <tbody>
              {sortedImpacts.map((impact, i) => {
                const priColor = impact.priority === 'critical' ? 'bg-red-500/10 text-red-400' : impact.priority === 'high' ? 'bg-orange-500/10 text-orange-400' : impact.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400';
                return (
                  <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-200">{impact.category}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priColor}`}>{impact.priority}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-red-400 font-mono">${impact.financialLoss.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right text-slate-300 font-mono">{impact.dataRecordsAffected.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right text-slate-300">{impact.downtimeHours}h</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={impact.reputationScore < 60 ? 'text-red-400' : impact.reputationScore < 75 ? 'text-amber-400' : 'text-green-400'}>
                        {impact.reputationScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400 max-w-[200px] truncate">{impact.complianceRisk}</td>
                    <td className="py-3 px-4 text-sm text-right text-green-400 font-mono">${impact.mitigationCost.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
