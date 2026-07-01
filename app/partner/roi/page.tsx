"use client";

import { useState } from "react";
import { Calculator, TrendingUp, DollarSign, Clock, Users, ArrowRight } from "lucide-react";

export default function PartnerROICalculator() {
  // Inputs
  const [incidentsPerMonth, setIncidentsPerMonth] = useState(500);
  const [minutesSavedPerIncident, setMinutesSavedPerIncident] = useState(45);
  const [analystHourlyCost, setAnalystHourlyCost] = useState(85);
  const [upsellACV, setUpsellACV] = useState(25000);
  const [upsellProbability, setUpsellProbability] = useState(15); // percentage

  // Outputs (Capacity First)
  // A. Hours recovered
  const hoursRecovered = (incidentsPerMonth * minutesSavedPerIncident) / 60;
  
  // B. Analyst capacity unlocked
  const fteCapacityUnlocked = hoursRecovered / 160;

  // C. Margin lift (Monthly)
  const marginLift = hoursRecovered * analystHourlyCost;

  // D. Upsell yield (Monthly approx based on probability applied to ACV, let's assume probability applies to closing 1 deal across portfolio per month, or just expected value of upsells per month across the tenant base). 
  // Let's assume the probability is the chance of upselling a single tenant each month for simplicity, or we can just say "Expected Monthly Upsell Yield" = (incidentsPerMonth/10) tenants * prob * ACV / 12. 
  // Keep it simpler: 20 tenants total (inferred). 
  // Let's just say "Expected Monthly Yield" = (upsellProbability / 100) * upsellACV
  const upsellYield = (upsellProbability / 100) * upsellACV;

  const totalEconomicImpact = marginLift + upsellYield;

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <Calculator className="w-8 h-8 text-emerald-500" />
            Partner ROI Calculator
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Calculate your operational capacity expansion and margin lift by deploying RiskLens across your managed portfolio.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUTS PANEL */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 rounded-xl border border-slate-800 space-y-6">
            <h2 className="text-lg font-bold text-white mb-4">Portfolio Assumptions</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 flex justify-between">
                Incidents Managed / Month
                <span className="text-slate-200">{incidentsPerMonth}</span>
              </label>
              <input 
                type="range" min="100" max="5000" step="100"
                value={incidentsPerMonth}
                onChange={(e) => setIncidentsPerMonth(parseInt(e.target.value))}
                className="w-full accent-fuchsia-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 flex justify-between">
                Avg. Minutes Saved / Incident
                <span className="text-slate-200">{minutesSavedPerIncident}m</span>
              </label>
              <input 
                type="range" min="5" max="120" step="5"
                value={minutesSavedPerIncident}
                onChange={(e) => setMinutesSavedPerIncident(parseInt(e.target.value))}
                className="w-full accent-fuchsia-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 flex justify-between">
                Analyst Fully Loaded Hourly Cost
                <span className="text-slate-200">${analystHourlyCost}</span>
              </label>
              <input 
                type="range" min="30" max="250" step="5"
                value={analystHourlyCost}
                onChange={(e) => setAnalystHourlyCost(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800">
              <label className="text-sm font-medium text-slate-400 flex justify-between">
                Target Upsell ACV (New Services)
                <span className="text-slate-200">${upsellACV.toLocaleString()}</span>
              </label>
              <input 
                type="range" min="5000" max="100000" step="1000"
                value={upsellACV}
                onChange={(e) => setUpsellACV(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 flex justify-between">
                Monthly Board-Packet Upsell Probability
                <span className="text-slate-200">{upsellProbability}%</span>
              </label>
              <input 
                type="range" min="1" max="50" step="1"
                value={upsellProbability}
                onChange={(e) => setUpsellProbability(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
            
          </div>
        </div>

        {/* OUTPUTS PANEL */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* A. Hours Recovered */}
            <div className="glass p-8 rounded-xl border border-slate-800 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clock className="w-24 h-24 text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">A. Time Reclaimed</h3>
              <div className="text-5xl font-black text-white font-mono mb-2">{hoursRecovered.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-2xl text-slate-500">hrs/mo</span></div>
              <p className="text-sm text-slate-400">Total manual analyst hours removed from operations.</p>
            </div>

            {/* B. Capacity Unlocked */}
            <div className="glass p-8 rounded-xl border border-blue-500/30 bg-blue-500/5 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-24 h-24 text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">B. Capacity Unlocked</h3>
              <div className="text-5xl font-black text-white font-mono mb-2">{fteCapacityUnlocked.toFixed(1)} <span className="text-2xl text-slate-500">FTEs</span></div>
              <p className="text-sm text-blue-200/60">Equivalent full-time Tier-1 analysts created without hiring.</p>
            </div>

            {/* C. Margin Lift */}
            <div className="glass p-8 rounded-xl border border-slate-800 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-24 h-24 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">C. Monthly Margin Lift</h3>
              <div className="text-5xl font-black text-emerald-400 font-mono mb-2">${marginLift.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
              <p className="text-sm text-slate-400">Direct reduction in labor cost of goods sold (COGS).</p>
            </div>

            {/* D. Upsell Yield */}
            <div className="glass p-8 rounded-xl border border-slate-800 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign className="w-24 h-24 text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">D. Expected Monthly Yield</h3>
              <div className="text-5xl font-black text-indigo-400 font-mono mb-2">${upsellYield.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
              <p className="text-sm text-slate-400">Probability-adjusted revenue from boardroom packet upselling.</p>
            </div>

          </div>

          {/* TOTAL ECONOMIC IMPACT */}
          <div className="bg-gradient-to-r from-emerald-900/40 to-cyan-900/40 border border-emerald-500/30 p-10 rounded-2xl flex flex-col md:flex-row items-center justify-between text-center md:text-left shadow-2xl">
            <div>
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">Total Monthly Economic Impact</h3>
              <p className="text-slate-300 max-w-md text-sm">Combined value of margin expansion and new revenue yield. This is the structural advantage RiskLens brings to your P&L.</p>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="text-5xl md:text-6xl font-black text-white font-mono tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                ${totalEconomicImpact.toLocaleString(undefined, {maximumFractionDigits: 0})}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
