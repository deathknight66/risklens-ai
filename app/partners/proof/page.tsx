"use client";

import Link from "next/link";
import { Shield, Target, TrendingDown, Star, Users, CheckCircle2 } from "lucide-react";

export default function PartnerProofVault() {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-300 font-sans">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#050816]/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/partners" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">RiskLens Partners</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/partners/apply" className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all">
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-24">
        
        {/* HEADER */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            The Proof Vault
          </h1>
          <p className="text-xl text-slate-400">
            Empirical data from live RiskLens MSSP deployments. Don't trust marketing. Trust the benchmark engine.
          </p>
        </section>

        {/* BENCHMARK DATA */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-8 rounded-2xl border border-slate-800 text-center space-y-4">
            <TrendingDown className="w-10 h-10 text-emerald-400 mx-auto" />
            <div className="text-4xl font-black text-white font-mono">41%</div>
            <div className="font-bold text-slate-300">Avg MTTR Reduction</div>
            <p className="text-sm text-slate-500">Across 150+ managed tenants over the last 90 days.</p>
          </div>
          
          <div className="glass p-8 rounded-2xl border border-slate-800 text-center space-y-4">
            <Target className="w-10 h-10 text-fuchsia-400 mx-auto" />
            <div className="text-4xl font-black text-white font-mono">82%</div>
            <div className="font-bold text-slate-300">Containment Rate</div>
            <p className="text-sm text-slate-500">Incidents resolved entirely by autonomous playbooks without human escalation.</p>
          </div>
          
          <div className="glass p-8 rounded-2xl border border-slate-800 text-center space-y-4">
            <Users className="w-10 h-10 text-blue-400 mx-auto" />
            <div className="text-4xl font-black text-white font-mono">+35%</div>
            <div className="font-bold text-slate-300">Analyst Capacity Lift</div>
            <p className="text-sm text-slate-500">More tenants managed per analyst, driving direct margin expansion.</p>
          </div>
        </section>

        {/* DEPLOYMENT SPEED */}
        <section className="max-w-4xl mx-auto text-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <h2 className="text-2xl font-bold text-emerald-400">Average deployment time: 14 Days</h2>
          <p className="text-slate-400 mt-2">Zero complex integrations. Standardized infrastructure deployed directly through the marketplace.</p>
        </section>

        {/* CASE STUDIES */}
        <section className="space-y-12">
          <h2 className="text-3xl font-bold text-white text-center">Anonymized Deployments</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute top-0 right-0 p-4">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">Finance Segment</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Boutique MSSP (East Coast)</h3>
              <p className="text-slate-400 mb-6">Scaled from 12 to 25 tenants without hiring additional Tier 1 analysts.</p>
              
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Challenge:</strong> Margin compression due to escalating alert volume across diverse client tech stacks.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Solution:</strong> Deployed RiskLens Fleet Dashboard and propagated 4 standardized playbooks globally.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Result:</strong> Reclaimed 450 analyst hours per month. Client retention increased to 100%.</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute top-0 right-0 p-4">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full border border-blue-500/20">Healthcare Segment</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">vCISO Consultancy</h3>
              <p className="text-slate-400 mb-6">Transitioned from hourly consulting to recurring managed response revenue.</p>
              
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Challenge:</strong> High vulnerability exposure but lacking 24/7 SOC capabilities.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Solution:</strong> Installed the RiskLens "SOC2 Detection Pack" from the Marketplace for 8 clients.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Result:</strong> Created a new $15k/mo recurring revenue stream via automated boardroom reporting.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* MARKETPLACE PROOF */}
        <section className="bg-gradient-to-br from-indigo-900/20 to-fuchsia-900/20 border border-indigo-500/20 rounded-3xl p-12 text-center space-y-8">
          <h2 className="text-3xl font-bold text-white max-w-2xl mx-auto">Top Performing Marketplace Assets</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Partners aren't just consumers; they are creators. Here are the top community assets driving industry-wide ROI.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 text-left">
            <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Playbook</div>
              <div className="font-bold text-lg text-white mb-1">Credential Stuffing Lockdown v3</div>
              <div className="text-sm text-slate-400 mb-4">Securita Global</div>
              <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-4">
                <span className="text-slate-500">142 Installs</span>
                <span className="text-amber-400 font-bold flex items-center gap-1"><Star className="w-3 h-3" /> 4.8</span>
              </div>
            </div>
            <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Compliance Pack</div>
              <div className="font-bold text-lg text-white mb-1">SOC2 Detection Pack</div>
              <div className="text-sm text-slate-400 mb-4">Securita Global</div>
              <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-4">
                <span className="text-slate-500">85 Installs</span>
                <span className="text-amber-400 font-bold flex items-center gap-1"><Star className="w-3 h-3" /> 4.9</span>
              </div>
            </div>
            <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider mb-2">Benchmark Pack</div>
              <div className="font-bold text-lg text-white mb-1">Finance MTTR Optimization</div>
              <div className="text-sm text-slate-400 mb-4">AlphaSec Consultants</div>
              <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-4">
                <span className="text-slate-500">34 Installs</span>
                <span className="text-amber-400 font-bold flex items-center gap-1"><Star className="w-3 h-3" /> 5.0</span>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
