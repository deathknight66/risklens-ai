'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Monitor,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Globe,
  Server,
  Cloud,
  Cpu,
  Flame,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import { cn, getSeverityBg } from '@/lib/utils'
import {
  dashboardMetrics,
  timelineData,
  threatDistribution,
  threatAlerts,
  attackSourcesData,
  systemStatuses,
} from '@/lib/mock-data'

/* ================================================================
   Custom Recharts Tooltip
   ================================================================ */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="glass rounded-lg px-4 py-3 shadow-xl border border-slate-700/50">
      <p className="text-xs text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300 capitalize">{entry.name}:</span>
          <span className="text-slate-100 font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ================================================================
   Circular Progress Ring
   ================================================================ */
function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference)
    }, 300)
    return () => clearTimeout(timer)
  }, [score, circumference])

  const getColor = (s: number) => {
    if (s >= 80) return '#22c55e'
    if (s >= 60) return '#f59e0b'
    if (s >= 40) return '#f97316'
    return '#ef4444'
  }

  const color = getColor(score)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(51,65,85,0.4)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${color}50)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-100">{score}</span>
        <span className="text-[10px] text-slate-500 font-medium">/100</span>
      </div>
    </div>
  )
}

/* ================================================================
   Stat Card Component
   ================================================================ */
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color,
  delay,
  children,
}: {
  title: string
  value: string | number | React.ReactNode
  subtitle?: string
  icon: React.ElementType
  trend?: 'up' | 'down'
  trendValue?: string
  color: string
  delay: number
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'glass rounded-xl p-5 card-hover animate-slide-up',
        'relative overflow-hidden group'
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Background glow */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-20"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span className="text-sm text-slate-400 font-medium">{title}</span>
          </div>

          {typeof value === 'string' || typeof value === 'number' ? (
            <p className="text-3xl font-bold text-slate-100">{value}</p>
          ) : (
            value
          )}

          {(subtitle || trend) && (
            <div className="flex items-center gap-2 mt-2">
              {trend && (
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-xs font-semibold',
                    trend === 'up' ? 'text-red-400' : 'text-green-400'
                  )}
                >
                  {trend === 'up' ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {trendValue}
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-slate-500">{subtitle}</span>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   System Status Icon by Type
   ================================================================ */
function SystemIcon({ type }: { type: string }) {
  switch (type) {
    case 'firewall':
      return <Flame className="w-4 h-4 text-orange-400" />
    case 'server':
      return <Server className="w-4 h-4 text-blue-400" />
    case 'cloud':
      return <Cloud className="w-4 h-4 text-cyan-400" />
    case 'endpoint':
      return <Cpu className="w-4 h-4 text-purple-400" />
    default:
      return <Monitor className="w-4 h-4 text-slate-400" />
  }
}

/* ================================================================
   Status Dot
   ================================================================ */
function StatusDot({ status }: { status: string }) {
  const color =
    status === 'online'
      ? 'bg-green-500'
      : status === 'warning'
      ? 'bg-amber-500'
      : 'bg-red-500'

  return (
    <span className="relative flex items-center gap-1.5">
      <span className={cn('w-2 h-2 rounded-full', color)} />
      {status === 'online' && (
        <span
          className={cn(
            'absolute w-2 h-2 rounded-full animate-ping',
            color,
            'opacity-40'
          )}
        />
      )}
    </span>
  )
}

/* ================================================================
   Format threat type label
   ================================================================ */
function formatThreatType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/* ================================================================
   Dashboard Overview Page
   ================================================================ */
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const maxAttacks = Math.max(...attackSourcesData.map((d) => d.attacks))

  return (
    <div className="space-y-6 pb-8">
      {/* ============================================
          Header Row
          ============================================ */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Security Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Last updated: 2 minutes ago
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-emerald-400 tracking-wide">
            Live
          </span>
        </div>
      </div>

      {/* ============================================
          Stat Cards Row
          ============================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Security Score */}
        <StatCard
          title="Security Score"
          value={<ScoreRing score={dashboardMetrics.securityScore} />}
          color="#06b6d4"
          icon={Shield}
          delay={100}
          subtitle="Needs improvement"
        />

        {/* Active Threats */}
        <StatCard
          title="Active Threats"
          value={dashboardMetrics.criticalThreats}
          color="#ef4444"
          icon={ShieldAlert}
          delay={200}
        >
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
              {dashboardMetrics.criticalThreats} critical
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
              {dashboardMetrics.highThreats} high
            </span>
          </div>
        </StatCard>

        {/* Alerts Today */}
        <StatCard
          title="Alerts Today"
          value={dashboardMetrics.alertsToday}
          color="#f59e0b"
          icon={AlertTriangle}
          trend="up"
          trendValue="+12%"
          subtitle="vs yesterday"
          delay={300}
        />

        {/* Systems Monitored */}
        <StatCard
          title="Systems Monitored"
          value={dashboardMetrics.systemsMonitored}
          color="#22c55e"
          icon={Monitor}
          delay={400}
          subtitle="99.2% online"
        />
      </div>

      {/* ============================================
          Charts Row: Threat Trends + Distribution
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Threat Trend Chart (2/3 width) */}
        <div
          className="lg:col-span-2 glass rounded-xl p-6 animate-slide-up"
          style={{ animationDelay: '500ms', animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Threat Trends (30 Days)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Threats detected, blocked, and resolved
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs text-slate-400">Threats</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span className="text-xs text-slate-400">Blocked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400">Resolved</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={timelineData}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(51,65,85,0.3)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(51,65,85,0.3)' }}
                tickLine={false}
                tickFormatter={(val: string) => {
                  const d = new Date(val)
                  return `${d.getMonth() + 1}/${d.getDate()}`
                }}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="threats"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#threatGrad)"
              />
              <Area
                type="monotone"
                dataKey="blocked"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#blockedGrad)"
              />
              <Area
                type="monotone"
                dataKey="resolved"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#resolvedGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Threat Distribution Donut (1/3 width) */}
        <div
          className="glass rounded-xl p-6 animate-slide-up"
          style={{ animationDelay: '600ms', animationFillMode: 'both' }}
        >
          <h2 className="text-lg font-semibold text-slate-100 mb-1">
            Threat Distribution
          </h2>
          <p className="text-xs text-slate-500 mb-4">By attack type</p>

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={threatDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {threatDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const data = payload[0].payload as (typeof threatDistribution)[0]
                  return (
                    <div className="glass rounded-lg px-3 py-2 shadow-xl border border-slate-700/50">
                      <p className="text-xs text-slate-200 font-medium">
                        {data.name}
                      </p>
                      <p className="text-sm font-bold text-slate-100">
                        {data.value}%
                      </p>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {threatDistribution.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-slate-400 truncate">
                  {entry.name}
                </span>
                <span className="text-xs text-slate-300 font-semibold ml-auto">
                  {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================
          Recent Alerts Table
          ============================================ */}
      <div
        className="glass rounded-xl p-6 animate-slide-up"
        style={{ animationDelay: '700ms', animationFillMode: 'both' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Recent Alerts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest security events requiring attention
            </p>
          </div>
          <Link
            href="/dashboard/threats"
            className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium group"
          >
            View All
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 pr-4">
                  Severity
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 pr-4">
                  Type
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 pr-4">
                  Source
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 pr-4">
                  Target
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 pr-4 min-w-[140px]">
                  Risk Score
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 pr-4">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {threatAlerts.slice(0, 5).map((alert) => {
                const riskColor =
                  alert.riskScore >= 80
                    ? 'bg-red-500'
                    : alert.riskScore >= 60
                    ? 'bg-orange-500'
                    : alert.riskScore >= 40
                    ? 'bg-amber-500'
                    : 'bg-green-500'

                const statusColor =
                  alert.status === 'active'
                    ? 'text-red-400'
                    : alert.status === 'investigating'
                    ? 'text-amber-400'
                    : alert.status === 'mitigated'
                    ? 'text-blue-400'
                    : 'text-green-400'

                const statusDotColor =
                  alert.status === 'active'
                    ? 'bg-red-500'
                    : alert.status === 'investigating'
                    ? 'bg-amber-500'
                    : alert.status === 'mitigated'
                    ? 'bg-blue-500'
                    : 'bg-green-500'

                const time = new Date(alert.timestamp)
                const timeStr = time.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })

                return (
                  <tr
                    key={alert.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Severity */}
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize',
                          getSeverityBg(alert.severity)
                        )}
                      >
                        {alert.severity}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-3 pr-4">
                      <span className="text-sm text-slate-200 font-medium">
                        {formatThreatType(alert.type)}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="py-3 pr-4">
                      <span className="text-sm text-slate-400 font-mono">
                        {alert.source}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="py-3 pr-4">
                      <span className="text-sm text-slate-400 font-mono">
                        {alert.target}
                      </span>
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-700',
                              riskColor
                            )}
                            style={{ width: `${alert.riskScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-300 font-semibold w-8 text-right">
                          {alert.riskScore}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium capitalize',
                          statusColor
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            statusDotColor
                          )}
                        />
                        {alert.status}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="py-3">
                      <span className="text-xs text-slate-500">{timeStr}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================
          Bottom Row: Attack Sources + System Status
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attack Sources */}
        <div
          className="glass rounded-xl p-6 animate-slide-up"
          style={{ animationDelay: '800ms', animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Top Attack Sources
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Geographic origin of detected attacks
              </p>
            </div>
            <Globe className="w-5 h-5 text-slate-600" />
          </div>

          <div className="space-y-3">
            {attackSourcesData.map((source, index) => (
              <div key={source.country} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-mono w-4">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-300 font-medium">
                      {source.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {source.percentage}%
                    </span>
                    <span className="text-sm text-slate-200 font-semibold w-10 text-right">
                      {source.attacks}
                    </span>
                  </div>
                </div>
                <div className="ml-6 h-1.5 rounded-full bg-slate-700/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-700 group-hover:shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                    style={{
                      width: `${(source.attacks / maxAttacks) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div
          className="glass rounded-xl p-6 animate-slide-up"
          style={{ animationDelay: '900ms', animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                System Status
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Infrastructure health monitoring
              </p>
            </div>
            <Activity className="w-5 h-5 text-slate-600" />
          </div>

          <div className="space-y-1">
            {systemStatuses.map((system) => (
              <div
                key={system.name}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-800/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/60">
                    <SystemIcon type={system.type} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-200 font-medium">
                      {system.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Last check: {system.lastCheck}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400 font-mono">
                    {system.uptime}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={system.status} />
                    <span
                      className={cn(
                        'text-xs font-medium capitalize',
                        system.status === 'online'
                          ? 'text-green-400'
                          : system.status === 'warning'
                          ? 'text-amber-400'
                          : 'text-red-400'
                      )}
                    >
                      {system.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
