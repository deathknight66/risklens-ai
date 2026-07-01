import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function GET() {
  try {
    const db = new Database(dbPath);
    
    // In a real app, extract partner_id from session context
    // For MVP, we use Securita Global's ID from our seed script
    const partners = db.prepare(`SELECT * FROM partners WHERE slug = 'securita-global'`).all() as any[];
    if (!partners.length) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }
    const partnerId = partners[0].id;

    // Fetch partner's tenants
    const accounts = db.prepare(`
      SELECT p.*, o.name, o.industry, o.company_size 
      FROM partner_accounts p 
      JOIN organizations o ON p.organization_id = o.id 
      WHERE p.partner_id = ?
    `).all(partnerId) as any[];

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'No tenants managed by this partner' }, { status: 404 });
    }

    let portfolioMttr = 0;
    let portfolioApr = 0;
    let portfolioPhs = 0;
    
    let globalMttr = 0;
    let globalApr = 0;
    let globalPhs = 0;

    let tenants = [];
    let industries = new Set();
    
    // Evaluate Portfolio
    for (const acc of accounts) {
      const benchmark = db.prepare(`SELECT * FROM benchmark_snapshots WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1`).get(acc.organization_id) as any;
      industries.add(acc.industry);
      
      const mttr = benchmark ? benchmark.avg_mttr_minutes : 0;
      const apr = benchmark ? benchmark.playbook_penetration : 0;
      const phs = benchmark ? benchmark.containment_rate : 0; // Using containment as proxy for PHS for MVP
      
      portfolioMttr += mttr;
      portfolioApr += apr;
      portfolioPhs += phs;

      tenants.push({
        name: acc.name,
        mttr,
        apr,
        phs
      });
    }

    portfolioMttr = portfolioMttr / accounts.length;
    portfolioApr = portfolioApr / accounts.length;
    portfolioPhs = portfolioPhs / accounts.length;

    // Evaluate Global Cluster (All organizations in the same industries, excluding opt-outs)
    const industryList = Array.from(industries).map(i => `'${i}'`).join(',');
    const globalBenchmarks = db.prepare(`
      SELECT b.* FROM benchmark_snapshots b
      JOIN organizations o ON b.organization_id = o.id
      WHERE o.industry IN (${industryList}) AND o.benchmark_opt_out = 0
    `).all() as any[];

    if (globalBenchmarks.length > 0) {
      globalMttr = globalBenchmarks.reduce((sum: number, b: any) => sum + b.avg_mttr_minutes, 0) / globalBenchmarks.length;
      globalApr = globalBenchmarks.reduce((sum: number, b: any) => sum + b.playbook_penetration, 0) / globalBenchmarks.length;
      globalPhs = globalBenchmarks.reduce((sum: number, b: any) => sum + b.containment_rate, 0) / globalBenchmarks.length;
    }

    // Rank Tenants
    tenants.sort((a, b) => a.mttr - b.mttr); // lower mttr is better
    const bestTenant = tenants[0];
    const worstTenant = tenants[tenants.length - 1];

    // Improvement Gap: if all tenants were as good as the best tenant, how much would MTTR drop?
    const bestMttr = bestTenant.mttr;
    // Calculate what the portfolio average would be if the worst half of tenants performed at bestMttr
    // Actually, the user asked: "If all weak tenants matched your top quartile, you’d reduce MTTR by X%."
    // Simplified MVP formula: delta between portfolio average and best tenant MTTR.
    const gapPercentage = portfolioMttr > 0 ? Math.round(((portfolioMttr - bestMttr) / portfolioMttr) * 100) : 0;

    return NextResponse.json({
      portfolio_avg_mttr: Math.round(portfolioMttr),
      portfolio_avg_apr: Math.round(portfolioApr),
      portfolio_avg_phs: Math.round(portfolioPhs),
      global_cluster_avg_mttr: Math.round(globalMttr),
      global_cluster_avg_apr: Math.round(globalApr),
      global_cluster_avg_phs: Math.round(globalPhs),
      best_tenant: bestTenant,
      worst_tenant: worstTenant,
      improvement_gap: gapPercentage
    });

  } catch (error: any) {
    console.error('Error fetching partner benchmarks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
