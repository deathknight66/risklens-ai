import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function POST(request: Request) {
  try {
    const { stack, incidents, activation_intent, orgId } = await request.json();

    const db = new Database(dbPath);

    // If orgId is provided, save the intent and step
    if (orgId) {
      db.prepare('UPDATE organizations SET activation_intent = ?, onboarding_step = ? WHERE id = ?').run(activation_intent, 'recommendation', orgId);
    }

    // Fetch all published playbooks
    const assets = db.prepare(`
      SELECT a.*, p.name as creator_name, p.tier as partner_tier 
      FROM marketplace_assets a
      JOIN partners p ON a.creator_partner_id = p.id
      WHERE a.status = 'published' AND a.category = 'playbook'
    `).all() as any[];

    // Recommendation logic: Rank playbooks based on stack and incidents
    // In a real system, this would use semantic search or ML ranking.
    // For MVP, we use deterministic keyword matching.
    const rankedPlaybooks = assets.map(asset => {
      let score = 0;
      const assetJson = asset.asset_json.toLowerCase();
      
      // Match stack
      if (stack && assetJson.includes(stack.toLowerCase())) score += 30;

      // Match incidents
      if (incidents && Array.isArray(incidents)) {
        incidents.forEach(incident => {
          if (assetJson.includes(incident.toLowerCase()) || asset.description.toLowerCase().includes(incident.toLowerCase())) {
            score += 20;
          }
        });
      }

      // Base trust score from db logic (simulated for MVP)
      const baseTrust = asset.verified ? 20 : 0;
      score += baseTrust;

      return {
        ...asset,
        relevance_score: score,
        // Calculate expected improvements based on intent
        expected_mttr_improvement_mins: asset.verified ? 45 : 15,
        benchmark_percentile_impact: asset.verified ? 85 : 55
      };
    });

    // Sort by relevance score
    rankedPlaybooks.sort((a, b) => b.relevance_score - a.relevance_score);

    // Return top 3 recommendations
    const topPlaybooks = rankedPlaybooks.slice(0, 3);

    return NextResponse.json({
      recommendations: topPlaybooks,
      summary: {
        total_expected_mttr_savings: topPlaybooks.reduce((acc, p) => acc + p.expected_mttr_improvement_mins, 0),
        primary_benchmark_uplift: Math.max(...topPlaybooks.map(p => p.benchmark_percentile_impact), 0)
      }
    });

  } catch (error: any) {
    console.error('Recommend POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
