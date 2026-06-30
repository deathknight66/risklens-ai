import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 1. Funnel & Weighted MRR
    const pipeline = db.prepare('SELECT * FROM design_partner_pipeline').all() as any[];
    
    const funnel = {
      leads: 0,
      contacted: 0,
      demos_booked: 0,
      pilots_active: 0,
      conversions: 0,
      churned: 0,
    };
    
    let weightedMrr = 0;
    
    // 2. Pipeline Aging
    const aging = {
      '0_3_days': 0,
      '4_7_days': 0,
      '8_14_days': 0,
      '14_plus_days': 0
    };

    const now = new Date();

    for (const deal of pipeline) {
      if (deal.status === 'lead') funnel.leads++;
      if (deal.status === 'contacted' || deal.status === 'replied') funnel.contacted++;
      if (deal.status === 'discovery_booked' || deal.status === 'demo_completed') funnel.demos_booked++;
      if (deal.status === 'pilot_offered' || deal.status === 'pilot_active') funnel.pilots_active++;
      if (deal.status === 'closed_won') funnel.conversions++;
      if (deal.status === 'closed_lost') funnel.churned++;

      // Weighted MRR: deal_value_estimate * champion_score%
      if (deal.status !== 'closed_lost' && deal.status !== 'closed_won' && deal.deal_value_estimate && deal.champion_score) {
         weightedMrr += deal.deal_value_estimate * (deal.champion_score / 100);
      }

      // Pipeline Aging
      if (deal.last_contact_at && deal.status !== 'closed_won' && deal.status !== 'closed_lost') {
        const daysSinceContact = (now.getTime() - new Date(deal.last_contact_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceContact <= 3) aging['0_3_days']++;
        else if (daysSinceContact <= 7) aging['4_7_days']++;
        else if (daysSinceContact <= 14) aging['8_14_days']++;
        else aging['14_plus_days']++;
      }
    }

    // 3. Pilot Health Score
    // Health Score = (incidents_ingested × 0.2) + (analyses_completed × 0.25) + (playbooks_triggered × 0.30) + (analyst_hours_saved × 0.25)
    const pilotMetricsRaw = db.prepare(`
      SELECT p.*, o.name as org_name
      FROM pilot_success_metrics p
      JOIN organizations o ON o.id = p.organization_id
    `).all() as any[];

    const pilotHealth = pilotMetricsRaw.map(p => {
      const score = (p.incidents_ingested * 0.2) + 
                    (p.analyses_completed * 0.25) + 
                    (p.playbooks_triggered * 0.3) + 
                    (p.analyst_hours_saved * 0.25);
      
      let status = 'dead';
      if (score > 50) status = 'healthy';
      else if (score > 10) status = 'passive';

      return {
        id: p.id,
        orgId: p.organization_id,
        organization: p.org_name,
        score: Math.round(score),
        status,
        containmentRate: p.containment_rate,
        ttfvMinutes: p.time_to_first_value_minutes,
        raw: p // keep raw metrics for renewal triggers
      };
    });

    // Expansion Signals (Fetch from beta_events per org)
    const expansionEvents = db.prepare(`
      SELECT organization_id, event_type, COUNT(*) as c
      FROM beta_events 
      WHERE event_type IN ('second_analyst_invited', 'second_integration_added', 'second_api_key_created')
      GROUP BY organization_id, event_type
    `).all() as any[];

    const expansionScores: Record<string, number> = {};
    const expansionSignals: Record<string, string[]> = {};
    for (const ev of expansionEvents) {
      if (!expansionScores[ev.organization_id]) {
        expansionScores[ev.organization_id] = 0;
        expansionSignals[ev.organization_id] = [];
      }
      if (ev.event_type === 'second_analyst_invited') {
        expansionScores[ev.organization_id] += 40;
        expansionSignals[ev.organization_id].push('Second Analyst Invited');
      }
      if (ev.event_type === 'second_integration_added') {
        expansionScores[ev.organization_id] += 35;
        expansionSignals[ev.organization_id].push('Second Integration Added');
      }
      if (ev.event_type === 'second_api_key_created') {
        expansionScores[ev.organization_id] += 25;
        expansionSignals[ev.organization_id].push('Second API Key Created');
      }
    }

    // Procurement Tracker & Close Probability Score
    const procurementTracker = pipeline.filter(d => d.status === 'pilot_active' || d.status === 'pilot_offered').map(d => {
      // Find associated pilot health
      // We assume company_name matches organization name for this prototype (or we lookup by orgId)
      const health = pilotHealth.find(p => p.organization === d.company_name);
      const pilotScore = health ? health.score : 0;
      // We assume orgId can be matched via company name, but for mock we'll just try to match it
      const orgId = health ? health.orgId : 'unknown';
      const expansionScore = expansionScores[orgId] || 0;
      const signals = expansionSignals[orgId] || [];

      let legalColor = 'green';
      if (d.legal_status === 'blocked') legalColor = 'red';
      else if (d.legal_status === 'pending') legalColor = 'yellow';

      let securityColor = 'green';
      if (d.security_review_status === 'blocked') securityColor = 'red';
      else if (d.security_review_status === 'pending') securityColor = 'yellow';

      let procurementProgress = 0;
      if (d.legal_status === 'approved') procurementProgress += 30;
      if (d.security_review_status === 'approved') procurementProgress += 30;
      if (d.budget_status === 'approved') procurementProgress += 20;
      if (d.exec_sponsor_status === 'approved') procurementProgress += 20;

      // Close Probability Formula
      // (Champion × 0.35) + (PilotHealth × 0.30) + (ProcurementProgress × 0.20) + (ExpansionSignals × 0.15)
      const championScore = d.champion_score || 0;
      const normalizedHealth = Math.min(100, (pilotScore / 50) * 100); // 50+ is healthy, treat 50 as 100%
      const normalizedExpansion = Math.min(100, expansionScore);

      const closeProbability = Math.round(
        (championScore * 0.35) + 
        (normalizedHealth * 0.30) + 
        (procurementProgress * 0.20) + 
        (normalizedExpansion * 0.15)
      );

      return {
        id: d.id,
        company: d.company_name,
        legalStatus: d.legal_status,
        securityStatus: d.security_review_status,
        budgetStatus: d.budget_status,
        execStatus: d.exec_sponsor_status,
        legalColor,
        securityColor,
        closeProbability,
        expansionScore,
        expansionSignals: signals
      };
    });

    // Renewal Trigger Engine
    const renewalTriggers = pilotHealth.filter(p => {
      // Containment > 40%, MTTR Delta > 25, Analyst Hours > 15
      return p.raw.containment_rate > 40 && p.raw.mttr_delta_minutes > 25 && p.raw.analyst_hours_saved > 15;
    }).map(p => ({
      organization: p.organization,
      message: `Renewal criteria met (Containment: ${p.raw.containment_rate}%, MTTR saved: ${p.raw.mttr_delta_minutes}m, Analyst Hours: ${p.raw.analyst_hours_saved}h). Conversion email drafted.`
    }));

    // 4. Objection Win Rate
    // Group by objection_type
    const objections = db.prepare('SELECT objection_type, resolved FROM sales_objections').all() as any[];
    const objectionStats: Record<string, { raised: number, resolved: number, winRate: number }> = {};
    
    for (const obj of objections) {
      if (!objectionStats[obj.objection_type]) {
        objectionStats[obj.objection_type] = { raised: 0, resolved: 0, winRate: 0 };
      }
      objectionStats[obj.objection_type].raised++;
      if (obj.resolved) {
        objectionStats[obj.objection_type].resolved++;
      }
    }

    for (const key in objectionStats) {
      objectionStats[key].winRate = Math.round((objectionStats[key].resolved / objectionStats[key].raised) * 100);
    }

    // Convert to array for UI
    const objectionArray = Object.keys(objectionStats).map(type => ({
      type,
      ...objectionStats[type]
    })).sort((a, b) => b.raised - a.raised);

    return NextResponse.json({
      funnel,
      weightedMrr: Math.round(weightedMrr),
      aging,
      pilotHealth,
      objectionWinRates: objectionArray,
      procurementTracker,
      renewalTriggers
    });

  } catch (error: any) {
    console.error('Revenue API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}
