import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function GET(req: Request) {
  try {
    const db = new Database(dbPath);
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partnerId') || 'securita-global'; // mock default
    
    // In a real app we'd get this from JWT
    const partner = db.prepare('SELECT * FROM partners WHERE slug = ? OR id = ?').get(partnerId, partnerId) as any;
    
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const accounts = db.prepare(`
      SELECT p.*, o.name as org_name, o.slug as org_slug, o.status as org_status
      FROM partner_accounts p
      JOIN organizations o ON p.organization_id = o.id
      WHERE p.partner_id = ?
    `).all(partner.id) as any[];

    const orgIds = accounts.map(a => a.organization_id);
    let totalIncidents = 0;
    let totalContained = 0;
    let mttrDeltas = [];
    let hoursSaved = 0;
    let slaBreaches = 0;
    let activePlaybooks = 0;

    const tenants = [];

    for (const acc of accounts) {
      // Mock metrics for each tenant
      const metrics = db.prepare('SELECT * FROM pilot_success_metrics WHERE organization_id = ?').get(acc.organization_id) as any;
      const playbooks = db.prepare('SELECT COUNT(*) as count FROM playbooks WHERE organization_id = ?').get(acc.organization_id) as any;
      const board = db.prepare('SELECT * FROM board_metrics WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1').get(acc.organization_id) as any;
      
      let tenantScore = 80; // default
      if (metrics) {
        totalIncidents += metrics.incidents_ingested;
        totalContained += Math.round(metrics.incidents_ingested * (metrics.containment_rate / 100));
        mttrDeltas.push(metrics.mttr_delta_minutes);
        hoursSaved += metrics.analyst_hours_saved;
        activePlaybooks += playbooks.count;
        tenantScore = Math.round((metrics.containment_rate * 0.7) + 30);
      }
      
      // SLA Breach logic mock (MTTR > 60 mins = breach)
      if (board && board.mttr_after > 60) {
        slaBreaches += 1;
      }

      tenants.push({
        id: acc.organization_id,
        name: acc.org_name,
        slug: acc.org_slug,
        healthScore: tenantScore,
        mttrReduction: metrics ? metrics.mttr_delta_minutes : 0,
        incidentsContained: metrics ? Math.round(metrics.incidents_ingested * (metrics.containment_rate / 100)) : 0,
        contractEnd: acc.contract_end
      });
    }

    const crossTenantMttr = mttrDeltas.length > 0 ? (mttrDeltas.reduce((a, b) => a + b, 0) / mttrDeltas.length) : 0;
    const portfolioHealthScore = tenants.length > 0 ? Math.round(tenants.reduce((a, b) => a + b.healthScore, 0) / tenants.length) : 0;

    return NextResponse.json({
      partner: {
        id: partner.id,
        name: partner.name,
        tier: partner.tier
      },
      metrics: {
        portfolioHealthScore, // PHS
        portfolioDeploymentRate: accounts.length > 0 ? 100 : 0, // PDR (mocked at 100%)
        activePlaybooksRatio: tenants.length > 0 ? Math.round(activePlaybooks / tenants.length) : 0, // APR
        crossTenantMttrMedian: Math.round(crossTenantMttr),
        fleetSlaBreachCount: slaBreaches,
        totalHoursSaved: hoursSaved
      },
      tenants
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
