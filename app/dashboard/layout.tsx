'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShieldAlert,
  Search,
  BarChart3,
  FileText,
  Settings,
  Shield,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  Zap,
  Database,
  User,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession, signOut } from 'next-auth/react'

const sidebarItems = [
  { label: 'SOC View', icon: LayoutDashboard, href: '/dashboard/soc', roles: ['Org Admin', 'SOC Analyst'] },
  { label: 'Board View', icon: BarChart3, href: '/dashboard/board', roles: ['Org Admin', 'Board Member'] },
  { label: 'Threats', icon: ShieldAlert, href: '/dashboard/threats', roles: ['Org Admin', 'SOC Analyst'] },
  { label: 'Investigation', icon: Search, href: '/dashboard/investigation', roles: ['Org Admin', 'SOC Analyst'] },
  { label: 'Actions', icon: Zap, href: '/dashboard/actions', roles: ['Org Admin', 'SOC Analyst'] },
  { label: 'Ingestion', icon: Database, href: '/dashboard/ingestion', roles: ['Org Admin', 'SOC Analyst'] },
  { label: 'Reports', icon: FileText, href: '/dashboard/reports', roles: ['Org Admin', 'SOC Analyst', 'Board Member'] },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string || 'Guest'

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#050816]">
      {/* Sidebar */}
      <aside
        className={cn(
          'relative flex flex-col h-full border-r border-slate-700/50',
          'bg-[#0a0e1a]/90 backdrop-blur-xl',
          'transition-all duration-300 ease-in-out z-30',
          sidebarExpanded ? 'w-64' : 'w-[72px]'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex items-center h-16 px-4 border-b border-slate-700/50',
            'shrink-0',
            sidebarExpanded ? 'gap-3' : 'justify-center'
          )}
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {sidebarExpanded && (
            <div className="flex flex-col overflow-hidden animate-fade-in">
              <span className="text-sm font-bold tracking-wide text-slate-100 whitespace-nowrap">
                RiskLens AI
              </span>
              <span className="text-[10px] text-cyan-400/80 font-medium tracking-widest uppercase whitespace-nowrap">
                Cyber Defense
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            if (item.roles && !item.roles.includes(role)) return null;
            
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group',
                  active
                    ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )}
              >
                <item.icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-indigo-400' : 'group-hover:text-slate-200')} />
                {sidebarExpanded && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Settings Link */}
        <div className="px-3 pb-2">
          <Link
            href="/dashboard/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg',
              'transition-all duration-200 group relative',
              pathname === '/dashboard/settings'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent',
              !sidebarExpanded && 'justify-center px-0'
            )}
          >
            <Settings
              className={cn(
                'w-5 h-5 shrink-0 transition-colors duration-200',
                pathname === '/dashboard/settings'
                  ? 'text-cyan-400'
                  : 'text-slate-500 group-hover:text-slate-300'
              )}
            />
            {sidebarExpanded && (
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                Settings
              </span>
            )}
            {!sidebarExpanded && (
              <div
                className={cn(
                  'absolute left-full ml-3 px-2.5 py-1.5 rounded-md',
                  'bg-slate-800 text-slate-200 text-xs font-medium',
                  'whitespace-nowrap shadow-xl border border-slate-700/50',
                  'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
                  'transition-all duration-200 z-50 pointer-events-none'
                )}
              >
                Settings
              </div>
            )}
          </Link>
        </div>

        {/* Collapse Toggle */}
        <div className="px-3 pb-4 pt-2 border-t border-slate-700/50">
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg',
              'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
              'transition-all duration-200',
              !sidebarExpanded && 'justify-center px-0'
            )}
          >
            {sidebarExpanded ? (
              <>
                <ChevronLeft className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            ) : (
              <ChevronRight className="w-5 h-5 shrink-0" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-slate-700/50 bg-[#0a0e1a]/70 backdrop-blur-xl shrink-0 z-20">
          {/* Left: mobile menu + search */}
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-400 hover:text-slate-200 transition-colors"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search threats, IPs, incidents..."
                className={cn(
                  'w-64 lg:w-80 pl-10 pr-4 py-2 rounded-lg',
                  'bg-slate-800/50 border border-slate-700/50',
                  'text-sm text-slate-200 placeholder:text-slate-500',
                  'focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50',
                  'transition-all duration-200'
                )}
              />
            </div>
          </div>

          {/* Right: notifications + avatar */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                <User className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">{role}</span>
              </div>
              <button onClick={() => signOut()} className="p-2 text-slate-400 hover:text-rose-400 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
              </button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
            {/* Divider */}
            <div className="w-px h-8 bg-slate-700/50" />

            {/* User Avatar */}
            <button className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center ring-2 ring-slate-700/50 group-hover:ring-cyan-500/30 transition-all duration-200">
                <span className="text-sm font-bold text-white">RD</span>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-[#0a0e1a]" />
              </div>
              {sidebarExpanded && (
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-sm font-medium text-slate-200">
                    Rudi G.
                  </span>
                  <span className="text-xs text-slate-500">Security Admin</span>
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
