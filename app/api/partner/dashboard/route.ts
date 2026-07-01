import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId is required' }, { status: 400 });
    }

    const db = new Database(dbPath);

    // Validate partner
    const partner = db.prepare(`SELECT * FROM partners WHERE id = ?`).get(partnerId) as any;
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Get partner accounts
    const accounts = db.prepare(`
      SELECT pa.*, o.name, o.slug, o.plan 
      FROM partner_accounts pa 
      JOIN organizations o ON pa.organization_id = o.id 
      WHERE pa.partner_id = ? AND pa.status = 'active'
    `).all(partnerId) as any[];

    if (accounts.length === 0) {
      return NextResponse.json({
        partner,
        portfolio_health: 0,
        at_risk_revenue: 0,
        dependency_risk: 0,
        automation_penetration: 0,
        commissions_due: 0,
        managed_mrr: 0,
        partner_yield: 0,
        accounts: [],
        expansion_heatmap: []
      });
    }

    let totalACV = 0;
    let atRiskRevenue = 0;
    let maxTenantACV = 0;
    let tenantsWithPlaybooks = 0;
    let expansionCandidates = [];

    let totalTenantHealth = 0;
    let totalRetentionHealth = 0;
    let totalExpansionPotential = 0;
    let totalRevenueYield = 0;

    const enrichedAccounts = accounts.map(acc => {
      const orgId = acc.organization_id;

      // Mock ACV (in real life, fetch from Stripe or billing table)
      const acv = acc.plan === 'enterprise' ? 120000 : 50000;
      totalACV += acv;
      if (acv > maxTenantACV) maxTenantACV = acv;

      // Pilot / Success Metrics
      const metrics = db.prepare(`SELECT * FROM pilot_success_metrics WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1`).get(orgId) as any;
      const playbooksTriggered = metrics?.playbooks_triggered || 0;
      if (playbooksTriggered > 0) tenantsWithPlaybooks++;

      const tenantHealth = Math.min(100, (playbooksTriggered / 10) * 100);
      
      // Thread Strength & Drift (GTM-6 proxy)
      const stakeholders = db.prepare(`SELECT * FROM stakeholder_map WHERE organization_id = ?`).all(orgId) as any[];
      const threadStrength = stakeholders.length > 1 ? 80 : 30; // simplified for dashboard proxy
      
      if (threadStrength < 40) {
        atRiskRevenue += acv;
      }

      const retentionHealth = threadStrength;
      const expansionScore = stakeholders.length * 10 + (playbooksTriggered > 5 ? 20 : 0);
      
      if (expansionScore > 60) {
        expansionCandidates.push({
          company: acc.name,
          score: expansionScore,
          reason: 'High playbook adoption and broad stakeholder spread'
        });
      }

      const revenueYield = 100; // Assuming paying accounts are yielding 100% of expected

      totalTenantHealth += tenantHealth;
      totalRetentionHealth += retentionHealth;
      totalExpansionPotential += Math.min(100, expansionScore);
      totalRevenueYield += revenueYield;

      return {
        ...acc,
        acv,
        tenantHealth,
        retentionHealth,
        threadStrength,
        playbooksTriggered
      };
    });

    const numAccounts = accounts.length;
    const avgTenantHealth = totalTenantHealth / numAccounts;
    const avgRetentionHealth = totalRetentionHealth / numAccounts;
    const avgExpansionPotential = totalExpansionPotential / numAccounts;
    const avgRevenueYield = totalRevenueYield / numAccounts;

    const portfolio_health = Math.round(
      (avgTenantHealth * 0.35) +
      (avgRetentionHealth * 0.25) +
      (avgExpansionPotential * 0.20) +
      (avgRevenueYield * 0.20)
    );

    const dependency_risk = totalACV > 0 ? Math.round((maxTenantACV / totalACV) * 100) : 0;
    const automation_penetration = Math.round((tenantsWithPlaybooks / numAccounts) * 100);
    const managed_mrr = totalACV / 12;
    const partner_yield = totalACV * (partner.rev_share_percent / 100);

    // Commissions
    const commissions = db.prepare(`SELECT SUM(commission_amount) as total FROM partner_commissions WHERE partner_id = ? AND status = 'pending'`).get(partnerId) as any;
    const commissions_due = commissions?.total || 0;

    return NextResponse.json({
      partner,
      portfolio_health,
      at_risk_revenue: atRiskRevenue,
      dependency_risk,
      automation_penetration,
      commissions_due,
      managed_mrr,
      partner_yield,
      accounts: enrichedAccounts,
      expansion_heatmap: expansionCandidates
    });

  } catch (error: any) {
    console.error('Error fetching partner dashboard data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
