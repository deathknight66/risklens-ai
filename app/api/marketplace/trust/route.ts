import { NextResponse } from "next/server";
import db from "@/lib/db";
import { calculateWeightedRating, calculateMarketplaceScore } from "@/lib/marketplace/ranking";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");

    if (!assetId) {
      return NextResponse.json({ error: "Missing assetId" }, { status: 400 });
    }

    // 1. Fetch Asset
    const asset = db.prepare('SELECT * FROM marketplace_assets WHERE id = ?').get(assetId) as any;
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // 2. Fetch Creator Reputation Cache
    let creatorRep = db.prepare('SELECT * FROM partner_reputation_cache WHERE partner_id = ?').get(asset.creator_partner_id) as any;
    if (!creatorRep) {
      // Mock default if no cache exists
      creatorRep = {
        avg_asset_rating: 4.5,
        benchmark_win_rate: 80,
        install_volume: 0
      };
    }

    // 3. Fetch Reviews for Weighted Rating
    const reviews = db.prepare('SELECT rating, verified_install FROM marketplace_reviews WHERE asset_id = ?').all(assetId) as any[];
    const weightedRating = reviews.length > 0 ? calculateWeightedRating(reviews) : asset.rating;

    // 4. Fetch Installs for Velocity (Mock logic for velocity metric)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentInstalls = db.prepare('SELECT COUNT(*) as count FROM marketplace_installs WHERE asset_id = ? AND installed_at >= ?').get(assetId, thirtyDaysAgo) as any;
    
    const installVelocityScore = Math.min(100, (recentInstalls.count / 50) * 100); // Normalize based on expected volume

    // 5. Calculate Metrics
    // In production, benchmarkUplift and retentionLift would be aggregated from tenant telemetry.
    // We mock the DB fetch for those two signals for the MVP while keeping the core signals dynamic.
    const benchmarkUplift = 85; 
    const retentionLift = 90;
    const creatorScore = creatorRep.benchmark_win_rate;

    const mts = calculateMarketplaceScore(
      weightedRating,
      installVelocityScore,
      benchmarkUplift,
      retentionLift,
      creatorScore
    );

    return NextResponse.json({
      assetId,
      marketplaceTrustScore: mts,
      signals: {
        weightedRating,
        installVelocity: recentInstalls.count,
        benchmarkUplift,
        retentionLift,
        creatorScore,
        totalReviews: reviews.length,
        totalInstalls: asset.installs,
        verifiedStatus: asset.verified === 1
      }
    });

  } catch (error: any) {
    console.error("Trust API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
