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

    // Fetch published assets for this partner
    const assets = db.prepare(`
      SELECT * FROM marketplace_assets 
      WHERE creator_partner_id = ?
    `).all(partnerId) as any[];

    // Calculate metrics
    let grossRevenue = 0;
    let netPayout = 0;
    let totalInstalls = 0;
    let avgRatingSum = 0;
    let ratedAssets = 0;

    const revSharePercent = partners[0].rev_share_percent || 70; // e.g. 70%

    // Aggregate payouts
    const payouts = db.prepare(`SELECT * FROM marketplace_payouts WHERE creator_partner_id = ?`).all(partnerId) as any[];
    
    for (const p of payouts) {
      grossRevenue += p.amount;
      if (p.status === 'pending') {
        netPayout += (p.amount * (revSharePercent / 100));
      }
    }

    for (const a of assets) {
      totalInstalls += a.installs;
      if (a.rating > 0) {
        avgRatingSum += a.rating;
        ratedAssets++;
      }
    }

    const avgRating = ratedAssets > 0 ? (avgRatingSum / ratedAssets).toFixed(1) : 0;
    
    // Mock Retention Lift for MVP
    const retentionLift = '+18%';

    return NextResponse.json({
      metrics: {
        gross_revenue: grossRevenue,
        net_pending: netPayout,
        total_installs: totalInstalls,
        avg_rating: avgRating,
        retention_lift: retentionLift
      },
      assets: assets
    });

  } catch (error: any) {
    console.error('Partner Marketplace GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
