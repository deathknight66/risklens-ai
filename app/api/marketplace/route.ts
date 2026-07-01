import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { calculateMarketplaceScore } from '@/lib/marketplace/ranking';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || 'org_default';

    const db = new Database(dbPath);

    // Fetch all published assets
    const assets = db.prepare(`
      SELECT a.*, p.name as creator_name, p.tier as partner_tier 
      FROM marketplace_assets a
      JOIN partners p ON a.creator_partner_id = p.id
      WHERE a.status = 'published'
    `).all() as any[];

    // Fetch user's installs to mark assets as "Installed"
    const installed = db.prepare(`
      SELECT asset_id FROM marketplace_installs WHERE organization_id = ?
    `).all(orgId).map((row: any) => row.asset_id);

    // Add deterministic score and install status
    const rankedAssets = assets.map(asset => {
      // 1. Fetch Creator Reputation Cache
      let creatorRep = db.prepare('SELECT * FROM partner_reputation_cache WHERE partner_id = ?').get(asset.creator_partner_id) as any;
      if (!creatorRep) {
        // Mock default if no cache exists
        creatorRep = {
          avg_asset_rating: 4.5,
          benchmark_win_rate: 80,
          install_volume: 0
        };
      }

      // 2. Fetch Installs for Velocity (Mock logic for MVP)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const recentInstalls = db.prepare('SELECT COUNT(*) as count FROM marketplace_installs WHERE asset_id = ? AND installed_at >= ?').get(asset.id, thirtyDaysAgo) as any;
      
      const installVelocityScore = Math.min(100, (recentInstalls.count / 50) * 100); 

      // 3. Dynamic metrics
      let benchmarkUplift = asset.verified ? 85 : 50;
      if (asset.category === 'benchmark_pack') benchmarkUplift = 95;
      
      const retentionLift = asset.verified ? 90 : 60; // Mocked for MVP
      const creatorScore = creatorRep.benchmark_win_rate;

      // Note: We use the asset's pre-calculated rating here for speed on the list view.
      // The detail page calculates the precise weighted rating live.
      const msScore = calculateMarketplaceScore(
        asset.rating,
        installVelocityScore,
        benchmarkUplift,
        retentionLift,
        creatorScore
      );

      return {
        ...asset,
        ms_score: msScore,
        is_installed: installed.includes(asset.id),
        install_velocity: recentInstalls.count,
        benchmark_uplift: benchmarkUplift
      };
    });

    // Sort by Marketplace Score (highest first)
    rankedAssets.sort((a, b) => b.ms_score - a.ms_score);

    return NextResponse.json(rankedAssets);

  } catch (error: any) {
    console.error('Marketplace GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
