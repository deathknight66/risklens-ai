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
        organization: p.org_name,
        score: Math.round(score),
        status,
        containmentRate: p.containment_rate,
        ttfvMinutes: p.time_to_first_value_minutes
      };
    });

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
      objectionWinRates: objectionArray
    });

  } catch (error: any) {
    console.error('Revenue API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}
