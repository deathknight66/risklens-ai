"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Network, Building2, BookOpen, CircleDollarSign, LogOut, Target, Store, Calculator } from "lucide-react";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/partner", label: "Fleet Dashboard", icon: Network },
    { href: "/partner/tenants", label: "Tenants", icon: Building2 },
    { href: "/partner/playbooks", label: "Playbooks", icon: BookOpen },
    { href: "/partner/benchmarks", label: "Benchmarks", icon: Target },
    { href: "/partner/marketplace", label: "Marketplace", icon: Store },
    { href: "/partner/roi", label: "ROI Calculator", icon: Calculator },
    { href: "/partner/commissions", label: "Commissions", icon: CircleDollarSign },
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-slate-300 font-sans flex">
      {/* Partner Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <Network className="w-6 h-6 text-fuchsia-500" />
          <span className="text-xl font-bold text-white tracking-tight">PartnerOS</span>
        </div>
        
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Workspace</div>
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/partner");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-fuchsia-500/10 text-fuchsia-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-slate-800 mt-auto">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800">
            <LogOut className="w-4 h-4" /> Sign Out
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
