import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch relevant deals (active pilots and closed won)
    const pipeline = db.prepare(`
      SELECT id, company_name, status 
      FROM design_partner_pipeline 
      WHERE status IN ('pilot_active', 'closed_won')
    `).all() as any[];

    // 2. Fetch required telemetry
    const orgNames = pipeline.map(p => p.company_name);
    if (orgNames.length === 0) return NextResponse.json({ candidates: [], dormant: [] });
    
    // We match by org name since we don't have org IDs on the pipeline directly in MVP,
    // but we can query organizations by name
    const orgs = db.prepare(`SELECT id, name FROM organizations`).all() as any[];
    
    const results = pipeline.map(deal => {
      const org = orgs.find(o => o.name === deal.company_name);
      const orgId = org ? org.id : null;

      let expansionScore = 0;
      let churnRisk = 0;
      let stakeholders = [];
      let championSpreadScore = 0;
      let dormant = false;

      if (orgId) {
        // Stakeholders
        stakeholders = db.prepare(`SELECT * FROM stakeholder_map WHERE organization_id = ?`).all(orgId) as any[];
        
        // Engagement Events
        const events = db.prepare(`SELECT * FROM deal_engagement_events WHERE organization_id = ? ORDER BY created_at DESC`).all(orgId) as any[];
        
        // Champion Spread: unique actors
        const uniqueActors = new Set(events.map(e => e.actor_hash)).size;
        championSpreadScore = Math.min(100, uniqueActors * 20); // cap at 100

        // Champion Silence
        const lastEvent = events.length > 0 ? new Date(events[0].created_at) : null;
        const daysSinceLastEvent = lastEvent ? Math.floor((Date.now() - lastEvent.getTime()) / (1000 * 60 * 60 * 24)) : 30;
        const championSilenceScore = Math.min(100, (daysSinceLastEvent / 14) * 100);

        // Activity & Automation Metrics (from pilot_success_metrics & beta_events)
        const metrics = db.prepare(`SELECT * FROM pilot_success_metrics WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1`).get(orgId) as any;
        
        // Mock calculations based on simple rules
        const seatGrowth = Math.min(100, stakeholders.length * 15);
        const workflowDepth = metrics ? Math.min(100, (metrics.playbooks_triggered / 50) * 100) : 0;
        const autoDep = metrics ? metrics.containment_rate : 0;
        const incComplexity = metrics ? Math.min(100, (metrics.analyses_completed / 100) * 100) : 0;

        expansionScore = Math.round(
          (seatGrowth * 0.25) +
          (workflowDepth * 0.20) +
          (autoDep * 0.20) +
          (incComplexity * 0.20) +
          (championSpreadScore * 0.15)
        );

        // Churn Predictor
        const activityDecay = metrics ? (metrics.analyses_completed < 5 ? 80 : 10) : 50;
        const autoDecay = metrics ? (metrics.playbooks_triggered < 2 ? 70 : 10) : 50;
        const seatRedux = stakeholders.length < 2 ? 60 : 0;

        churnRisk = Math.round(
          (activityDecay * 0.35) +
          (autoDecay * 0.25) +
          (championSilenceScore * 0.25) +
          (seatRedux * 0.15)
        );

        // Dormant Check
        if (daysSinceLastEvent > 14 && activityDecay > 50 && autoDecay > 50) {
          dormant = true;
        }
      }

      return {
        dealId: deal.id,
        company: deal.company_name,
        status: deal.status,
        orgId,
        expansionScore,
        churnRisk,
        dormant,
        stakeholderCount: stakeholders.length,
        hasSingleChampionRisk: stakeholders.length < 2,
        championSpread: championSpreadScore
      };
    });

    // Split into categories
    const candidates = results.filter(r => r.expansionScore >= 50).sort((a, b) => b.expansionScore - a.expansionScore);
    const dormantAccounts = results.filter(r => r.dormant || r.churnRisk > 60).sort((a, b) => b.churnRisk - a.churnRisk);

    return NextResponse.json({
      candidates,
      dormant: dormantAccounts,
      all: results
    });

  } catch (error: any) {
    console.error('Expansion Engine API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
