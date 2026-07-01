"use client";

import Link from "next/link";
import { Shield, Zap, TrendingUp, Network, BarChart3, Target, Server, ChevronRight, Store } from "lucide-react";

export default function PartnerLandingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-300 font-sans selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#050816]/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.3)]">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight group-hover:text-fuchsia-400 transition-colors">RiskLens Partners</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/partners/proof" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block">Proof Vault</Link>
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Partner Login</Link>
            <Link href="/partners/apply" className="px-5 py-2 text-sm font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-500 rounded-lg transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)]">
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-32">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-sm font-bold tracking-wide uppercase">
            <Zap className="w-4 h-4" /> The Operator's Moat
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-white to-slate-400 tracking-tight leading-tight">
            Increase client capacity per analyst by 35% without hiring.
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Stop scaling headcount linearly with client growth. RiskLens allows boutique MSSPs to standardize response, reduce MTTR by 30-50%, and operate their entire portfolio from a single pane of glass.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/partners/apply" className="px-8 py-4 text-lg font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] flex items-center gap-2 group">
              Start "First 3 Clients Free" Pilot <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* PROOF LAYER (Benchmark Engine) */}
        <section className="relative">
          <div className="absolute inset-0 bg-indigo-500/5 rounded-3xl blur-3xl -z-10" />
          <div className="glass rounded-3xl border border-indigo-500/20 p-12 text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Target className="w-48 h-48" />
            </div>
            <h2 className="text-3xl font-bold text-white max-w-2xl mx-auto">
              MSSPs using RiskLens autonomous containment resolve incidents <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">38% faster</span> than the peer median.
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Our global Benchmark Engine proves it. Stop selling promises and start selling statistically verified outcomes.
            </p>
            <div className="pt-4">
               <Link href="/partners/proof" className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center justify-center gap-2 group">
                 View the Partner Proof Vault <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>
          </div>
        </section>

        {/* ECONOMICS LAYER */}
        <section className="space-y-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Margin Expansion Architecture</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">We aren't selling you another SIEM. We are selling you operational leverage.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <TrendingUp className="w-8 h-8 text-emerald-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Margin Expansion</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Lower the manual labor required per incident. More containment autonomy directly translates to higher gross margins per contract.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <Shield className="w-8 h-8 text-blue-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Fewer Escalations</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Tier 1 analysts become Tier 3 capable. Autonomous playbooks handle the complex triage and correlation before human intervention.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <Zap className="w-8 h-8 text-amber-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Faster SLA Compliance</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Never breach an SLA again. Playbooks execute at machine speed, drastically lowering Time to Containment metrics.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <BarChart3 className="w-8 h-8 text-fuchsia-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">New Upsell Motion</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Automatically generate Board-Ready ROI Packets proving your value. Use empirical benchmark data to drive frictionless renewals.</p>
            </div>
          </div>
        </section>

        {/* FLYWHEEL LAYER */}
        <section className="py-12 border-t border-b border-slate-800/50">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">The Platform Flywheel</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Scale your expertise across the entire ecosystem.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <div className="p-6">
              <Network className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
              <div className="font-bold text-white mb-2">1. Operate</div>
              <p className="text-sm text-slate-400">Manage all tenants centrally</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-600 hidden md:block" />
            <div className="p-6">
              <Target className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
              <div className="font-bold text-white mb-2">2. Benchmark</div>
              <p className="text-sm text-slate-400">Identify top-performing playbooks</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-600 hidden md:block" />
            <div className="p-6">
              <Server className="w-10 h-10 text-fuchsia-400 mx-auto mb-4" />
              <div className="font-bold text-white mb-2">3. Package</div>
              <p className="text-sm text-slate-400">Codify into reusable assets</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-600 hidden md:block" />
            <div className="p-6">
              <Store className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
              <div className="font-bold text-white mb-2">4. Sell</div>
              <p className="text-sm text-slate-400">Monetize on the Marketplace</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to expand your margin?</h2>
          <p className="text-slate-400 mb-8">Join the Tier-1 MSSPs leveraging RiskLens. Get your first 3 clients onboarded absolutely free, including playbook migration and co-selling support.</p>
          <Link href="/partners/apply" className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)]">
            Apply to Partner Program
          </Link>
        </section>

      </main>
    </div>
  );
}
