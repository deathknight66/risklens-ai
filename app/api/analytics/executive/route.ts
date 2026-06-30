import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.activeOrganizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const orgId = session.user.activeOrganizationId;

    const now = new Date();
    
    // 1. Action Success Rate
    const actionStats = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM actions 
      WHERE organization_id = ? AND deleted_at IS NULL
      GROUP BY status
    `).all(orgId) as any[];

    let executed = 0;
    let failed = 0;
    let rolledBack = 0;
    let totalActions = 0;
    let automated = 0;

    actionStats.forEach(stat => {
      totalActions += stat.count;
      if (stat.status === 'Executed') executed += stat.count;
      if (stat.status === 'Failed') failed += stat.count;
      if (stat.status === 'Rolled Back') rolledBack += stat.count;
    });

    // Assume actions approved by PolicyEngine are automated
    const autoStats = db.prepare(`SELECT COUNT(*) as count FROM actions WHERE organization_id = ? AND deleted_at IS NULL AND approved_by LIKE 'PolicyEngine%'`).get(orgId) as any;
    automated = autoStats.count;
    const automationRate = totalActions > 0 ? (automated / totalActions) * 100 : 0;
    const successRate = totalActions > 0 ? ((executed + rolledBack) / totalActions) * 100 : 0;

    // 2. MTTC (Mean Time To Contain)
    const mttcData = db.prepare(`
      SELECT a.created_at as action_created, a.executed_at 
      FROM actions a
      WHERE a.organization_id = ? AND a.deleted_at IS NULL AND a.executed_at IS NOT NULL
    `).all(orgId) as any[];

    let totalContainmentTimeMs = 0;
    mttcData.forEach(act => {
      totalContainmentTimeMs += (new Date(act.executed_at).getTime() - new Date(act.action_created).getTime());
    });
    const mttcMinutes = mttcData.length > 0 ? (totalContainmentTimeMs / mttcData.length) / 60000 : 0;

    // 3. Projected Financial Loss Avoided
    // Mocking an arbitrary mapping per critical incident mitigated
    const criticalMitigated = db.prepare(`
      SELECT COUNT(*) as count FROM actions a
      JOIN incidents i ON a.incident_id = i.id
      WHERE a.organization_id = ? AND a.deleted_at IS NULL AND i.severity IN ('High', 'Critical') AND a.status IN ('Executed', 'Rolled Back')
    `).get(orgId) as any;
    
    const lossAvoided = criticalMitigated.count * 150000; // $150k per critical mitigated

    // 4. Threat Recurrence Velocity
    // For now we mock the velocity growth (+23%) as a static response for the demo
    const recurrenceVelocity = "+23%";

    // 5. Blast Radius Reduction (Mocking a timeline of 6 months)
    const blastRadiusData = [
      { month: 'Jan', beforeAction: 80, afterAction: 20 },
      { month: 'Feb', beforeAction: 85, afterAction: 15 },
      { month: 'Mar', beforeAction: 60, afterAction: 10 },
      { month: 'Apr', beforeAction: 95, afterAction: 25 },
      { month: 'May', beforeAction: 70, afterAction: 5 },
      { month: 'Jun', beforeAction: 100, afterAction: 10 },
    ];

    // 6. Top Targeted Assets
    const targetData = db.prepare(`
      SELECT target, COUNT(*) as attack_count 
      FROM actions 
      WHERE organization_id = ? AND deleted_at IS NULL
      GROUP BY target 
      ORDER BY attack_count DESC 
      LIMIT 5
    `).all(orgId) as any[];

    const assetData = targetData.map(row => ({
      name: row.target,
      attacks: row.attack_count
    }));

    // 7. Financial Exposure Trend (Mock)
    const financialExposure = [
      { date: 'Mon', exposure: 2000000, mitigated: 1900000 },
      { date: 'Tue', exposure: 1500000, mitigated: 1500000 },
      { date: 'Wed', exposure: 4000000, mitigated: 3800000 },
      { date: 'Thu', exposure: 1200000, mitigated: 1200000 },
      { date: 'Fri', exposure: 3500000, mitigated: 3400000 },
      { date: 'Sat', exposure: 500000, mitigated: 500000 },
      { date: 'Sun', exposure: 800000, mitigated: 800000 },
    ];

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          successRate: successRate.toFixed(1),
          automationRate: automationRate.toFixed(1),
          mttc: mttcMinutes.toFixed(1), // in minutes
          lossAvoided,
          recurrenceVelocity
        },
        charts: {
          blastRadiusData,
          assetData,
          financialExposure
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch executive analytics' }, { status: 500 });
  }
}
