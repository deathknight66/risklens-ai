'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Legend
} from 'recharts'
import {
  ShieldAlert, TrendingUp, Zap, Clock, ShieldCheck, Activity, BrainCircuit, Target
} from 'lucide-react'

export default function ExecutiveAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics/executive')
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading || !data) {
    return <div className="p-8 text-center text-slate-400">Loading Executive Analytics...</div>
  }

  const { kpis, charts } = data

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-fuchsia-400" /> Executive Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">Strategic overview of AI-driven cybersecurity posture</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="glass p-5 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Action Success</h3>
          </div>
          <p className="text-3xl font-bold text-white">{kpis.successRate}%</p>
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Highly reliable</p>
        </div>

        <div className="glass p-5 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <BrainCircuit className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Automation Rate</h3>
          </div>
          <p className="text-3xl font-bold text-white">{kpis.automationRate}%</p>
          <p className="text-xs text-purple-400 mt-2">Driven by Policy Engine</p>
        </div>

        <div className="glass p-5 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MTTC</h3>
          </div>
          <p className="text-3xl font-bold text-white">{kpis.mttc} <span className="text-lg text-slate-500">min</span></p>
          <p className="text-xs text-cyan-400 mt-2">Mean Time To Contain</p>
        </div>

        <div className="glass p-5 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Loss Avoided</h3>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(kpis.lossAvoided)}</p>
          <p className="text-xs text-green-400 mt-2">Projected financial savings</p>
        </div>

        <div className="glass p-5 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <Zap className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Threat Velocity</h3>
          </div>
          <p className="text-3xl font-bold text-rose-400">{kpis.recurrenceVelocity}</p>
          <p className="text-xs text-slate-400 mt-2">Repeated attack patterns</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: Blast Radius Reduction */}
        <div className="glass p-6 rounded-xl border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-400" /> Blast Radius Reduction
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={charts.blastRadiusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="beforeAction" name="Potential Impact" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
                <Line type="monotone" dataKey="afterAction" name="Contained Impact" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Financial Exposure */}
        <div className="glass p-6 rounded-xl border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" /> Financial Exposure vs Mitigation
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.financialExposure}>
                <defs>
                  <linearGradient id="colorMitigated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExposure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val/1000000}M`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(value: any) => formatCurrency(Number(value) || 0)}
                />
                <Area type="monotone" dataKey="exposure" name="Raw Exposure" stroke="#ef4444" fillOpacity={1} fill="url(#colorExposure)" />
                <Area type="monotone" dataKey="mitigated" name="Mitigated Loss" stroke="#10b981" fillOpacity={1} fill="url(#colorMitigated)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Top Targeted Assets */}
        <div className="glass p-6 rounded-xl border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" /> Top Targeted Infrastructure
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.assetData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#e2e8f0" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="attacks" name="Attack Volume" fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Intelligence Moat (Threat Clusters) */}
        <div className="glass p-6 rounded-xl border border-indigo-500/30 lg:col-span-1 bg-indigo-950/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <BrainCircuit size={150} />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2 relative z-10">
            <BrainCircuit className="w-5 h-5 text-indigo-400" /> Executive Threat Trends
          </h2>
          <p className="text-xs text-indigo-200/60 mb-6 relative z-10">AI-clustered campaigns across the organization.</p>
          <div className="h-64 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.threatClusters} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="volume" name="Incident Volume" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-indigo-500/20 flex justify-between items-center relative z-10">
            <div>
              <p className="text-xs text-indigo-300">Organizational Memory</p>
              <p className="text-xl font-bold text-white flex items-baseline gap-1">
                {kpis.memoryEdges} <span className="text-xs font-normal text-indigo-400">graph edges</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-indigo-300">Fastest Growing</p>
              <p className="text-sm font-semibold text-rose-400">Credential Abuse</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
