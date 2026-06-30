"use client";

import { useState } from "react";
import { Calculator, DollarSign, Clock, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export default function ROICalculator() {
  const [incidentsPerMonth, setIncidentsPerMonth] = useState<number>(500);
  const [triageTimeMinutes, setTriageTimeMinutes] = useState<number>(45);
  const [analystHourlyCost, setAnalystHourlyCost] = useState<number>(75);
  const [percentAutoContained, setPercentAutoContained] = useState<number>(60);

  // Calculations
  const triageTimeHours = triageTimeMinutes / 60;
  
  // Current
  const currentMonthlyHours = incidentsPerMonth * triageTimeHours;
  const currentMonthlyCost = currentMonthlyHours * analystHourlyCost;
  const currentAnnualCost = currentMonthlyCost * 12;

  // With RiskLens
  const automatedIncidents = incidentsPerMonth * (percentAutoContained / 100);
  const manualIncidents = incidentsPerMonth - automatedIncidents;
  
  // RiskLens drastically reduces MTTR even for manual review via AI Summaries (assume 5 min instead of 45)
  const rlManualTriageHours = (5 / 60); 
  const rlMonthlyHours = (automatedIncidents * 0) + (manualIncidents * rlManualTriageHours);
  const rlMonthlyCost = rlMonthlyHours * analystHourlyCost;
  const rlAnnualCost = rlMonthlyCost * 12;

  const annualSavings = currentAnnualCost - rlAnnualCost;
  const mttrDelta = triageTimeMinutes - (automatedIncidents * 0 + manualIncidents * 5) / incidentsPerMonth;

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="min-h-screen bg-[#050816] flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-5xl space-y-8">
        
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <Calculator className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">RiskLens ROI Calculator</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Calculate the exact financial impact of autonomous incident intelligence on your Security Operations Center.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
          
          {/* Inputs */}
          <div className="lg:col-span-5 bg-[#0a0e1a] border border-slate-800 p-8 rounded-2xl shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-6 border-b border-slate-800 pb-4">Your SOC Metrics</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex justify-between text-sm font-medium text-slate-300">
                  <span>Incidents per Month</span>
                  <span className="text-indigo-400 font-mono">{incidentsPerMonth}</span>
                </label>
                <input 
                  type="range" min="50" max="5000" step="50"
                  value={incidentsPerMonth}
                  onChange={(e) => setIncidentsPerMonth(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex justify-between text-sm font-medium text-slate-300">
                  <span>Avg Triage Time (Minutes)</span>
                  <span className="text-indigo-400 font-mono">{triageTimeMinutes}m</span>
                </label>
                <input 
                  type="range" min="10" max="180" step="5"
                  value={triageTimeMinutes}
                  onChange={(e) => setTriageTimeMinutes(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex justify-between text-sm font-medium text-slate-300">
                  <span>Analyst Hourly Cost (Fully Loaded)</span>
                  <span className="text-indigo-400 font-mono">${analystHourlyCost}</span>
                </label>
                <input 
                  type="range" min="30" max="250" step="5"
                  value={analystHourlyCost}
                  onChange={(e) => setAnalystHourlyCost(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex justify-between text-sm font-medium text-slate-300">
                  <span>Target % Auto-Contained</span>
                  <span className="text-indigo-400 font-mono">{percentAutoContained}%</span>
                </label>
                <input 
                  type="range" min="10" max="95" step="5"
                  value={percentAutoContained}
                  onChange={(e) => setPercentAutoContained(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Outputs */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <DollarSign className="w-24 h-24" />
                </div>
                <p className="text-sm font-medium text-slate-400 mb-2">Current Annual Labor Cost</p>
                <div className="text-4xl font-bold text-white font-mono">{formatCurrency(currentAnnualCost)}</div>
                <p className="text-xs text-slate-500 mt-2">Spent entirely on manual alert triage.</p>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldCheck className="w-24 h-24 text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-indigo-300 mb-2">Cost with RiskLens</p>
                <div className="text-4xl font-bold text-indigo-400 font-mono">{formatCurrency(rlAnnualCost)}</div>
                <p className="text-xs text-indigo-400/60 mt-2">With AI summaries and autonomous containment.</p>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-2xl text-center">
              <p className="text-lg font-medium text-emerald-400 mb-2">Projected Annual Savings</p>
              <div className="text-6xl font-black text-emerald-400 tracking-tight font-mono mb-4">
                {formatCurrency(annualSavings)}
              </div>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-emerald-400/80">
                  <Clock className="w-4 h-4" />
                  <span>{((currentAnnualCost - rlAnnualCost) / analystHourlyCost).toFixed(0)} Hours Reclaimed</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400/80">
                  <Zap className="w-4 h-4" />
                  <span>MTTR Reduced by {mttrDelta.toFixed(1)} mins</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Link href="/onboarding" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20">
                Start Free Pilot
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
