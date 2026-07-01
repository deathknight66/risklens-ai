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
      // For MVP, we derive install velocity and benchmark uplift deterministically from the database stats
      // Assume max installs in DB is 500 for normalization
      const installVelocity = Math.min(100, (asset.installs / 500) * 100);
      
      // Mock benchmark uplift based on category and verification for MVP
      let benchmarkUplift = asset.verified ? 80 : 40;
      if (asset.category === 'benchmark_pack') benchmarkUplift = 95;

      const partnerReputation = asset.partner_tier === 'platinum' ? 100 : (asset.partner_tier === 'gold' ? 80 : 50);

      const msScore = calculateMarketplaceScore(
        asset.rating,
        installVelocity,
        benchmarkUplift,
        partnerReputation
      );

      return {
        ...asset,
        ms_score: msScore,
        is_installed: installed.includes(asset.id)
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
