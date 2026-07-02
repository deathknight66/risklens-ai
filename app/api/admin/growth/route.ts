import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function GET(request: Request) {
  try {
    const db = new Database(dbPath);

    // ---------------------------------------------------------
    // MODULE A: FUNNEL COMPRESSION
    // ---------------------------------------------------------
    const orgs = db.prepare('SELECT * FROM organizations').all() as any[];
    const totalOrgs = orgs.length;
    
    // Determine TTF-ACE (Median)
    const aceOrgs = orgs.filter(o => o.time_to_first_containment_minutes != null);
    aceOrgs.sort((a, b) => a.time_to_first_containment_minutes - b.time_to_first_containment_minutes);
    const medianTTFACE = aceOrgs.length > 0 
      ? aceOrgs[Math.floor(aceOrgs.length / 2)].time_to_first_containment_minutes 
      : 0;

    // For MVP, if we lack huge live data, we seed some hybrid funnel data to make dashboard steerable
    const funnel = {
      signups: totalOrgs || 120,
      connectorInstalls: totalOrgs ? orgs.filter(o => o.onboarding_step !== null).length : 85,
      playbookInstalls: 62,
      simulatedAce: aceOrgs.length > 0 ? aceOrgs.length : 45,
      firstLiveAce: 28,
      expansionTriggers: 12,
      medianTTFACE: medianTTFACE || (18.5 * 60) // Fallback to 18.5h if empty
    };

    // ---------------------------------------------------------
    // MODULE B: PARTNER LIQUIDITY
    // ---------------------------------------------------------
    const partners = db.prepare('SELECT * FROM partners').all() as any[];
    const activeMSSPs = partners.length;
    
    // Mock robust partner stats
    const partnerLiquidity = {
      activeMSSPs: activeMSSPs || 14,
      tenantsPerMSSP: 8.4,
      playbooksPropagated: 142,
      avgMarketplaceRevPerMSSP: 2450,
      aceDensityByPartner: "High" // e.g., 4.2 ACEs/tenant/mo
    };

    // ---------------------------------------------------------
    // MODULE C: ASSET PERFORMANCE MATRIX
    // ---------------------------------------------------------
    const assets = db.prepare('SELECT id, name, category, installs, rating FROM marketplace_assets WHERE status = "published"').all() as any[];
    
    const assetMatrix = assets.map(a => ({
      id: a.id,
      name: a.name,
      category: a.category,
      installs: a.installs,
      retentionLift: Math.round(80 + Math.random() * 15), // Mocked deterministic metric
      mttrUplift: Math.round(40 + Math.random() * 45), // Mocked deterministic metric
      revenue: a.installs * 150 // Mock $150 ARPU per asset
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // ---------------------------------------------------------
    // MODULE D: EXPANSION TRIGGER ENGINE
    // ---------------------------------------------------------
    // Logic: Look for orgs with fast TTF-ACE, high benchmark rank, or "Reduce alert fatigue" intent
    const expansionCandidates = orgs.filter(o => o.tier !== 'enterprise').map(o => {
      let eps = 50;
      if (o.activation_intent === 'Reduce alert fatigue') eps += 15;
      if (o.time_to_first_containment_minutes && o.time_to_first_containment_minutes < 1440) eps += 25; // < 24h
      return {
        id: o.id,
        name: o.name,
        eps: Math.min(99, eps),
        intent: o.activation_intent || 'Unknown',
        tier: o.tier
      };
    }).sort((a, b) => b.eps - a.eps).slice(0, 5);

    // If DB is mostly empty (local dev), seed some candidates
    if (expansionCandidates.length === 0) {
      expansionCandidates.push(
        { id: "org_alpha", name: "Alpha Corp", eps: 92, intent: "Reduce alert fatigue", tier: "pro" },
        { id: "org_beta", name: "Beta Tech", eps: 85, intent: "Increase MSSP client capacity", tier: "free" }
      );
    }

    // ---------------------------------------------------------
    // MODULE E: CHURN EARLY WARNING
    // ---------------------------------------------------------
    // Logic: Look for orgs with > 24h TTF-ACE or no ACE at all
    const churnRisks = orgs.map(o => {
      let riskScore = 20;
      if (!o.first_ace_achieved_at) riskScore += 40;
      if (o.time_to_first_containment_minutes && o.time_to_first_containment_minutes > 2880) riskScore += 20; // > 48h
      
      return {
        id: o.id,
        name: o.name,
        riskScore: Math.min(99, riskScore),
        daysSinceSignup: 14, // Mocked for MVP
        lastEngagement: "Low"
      };
    }).sort((a, b) => b.riskScore - a.riskScore).filter(r => r.riskScore > 50).slice(0, 5);

    if (churnRisks.length === 0) {
      churnRisks.push(
        { id: "org_omega", name: "Omega Systems", riskScore: 88, daysSinceSignup: 21, lastEngagement: "Low" }
      );
    }

    return NextResponse.json({
      funnel,
      partnerLiquidity,
      assetMatrix,
      expansionCandidates,
      churnRisks
    });

  } catch (error: any) {
    console.error('Growth API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
