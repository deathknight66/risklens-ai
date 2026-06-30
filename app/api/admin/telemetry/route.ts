import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Minimal security check for this specific endpoint for MVP (SuperAdmin concept)
  // We can lock this down further later.

  try {
    const rawEvents = db.prepare(`
      SELECT 
        b.organization_id,
        o.name as org_name,
        b.event_type,
        b.created_at
      FROM beta_events b
      JOIN organizations o ON o.id = b.organization_id
      ORDER BY b.created_at ASC
    `).all() as any[];

    // Process data to calculate TTV, TTA and Drop-offs
    const orgStats: Record<string, any> = {};
    const funnel = {
      onboarding_started: 0,
      api_key_generated: 0,
      first_log_ingested: 0,
      first_incident_created: 0,
      first_ai_analysis: 0,
      first_playbook_run: 0
    };

    for (const evt of rawEvents) {
      if (!orgStats[evt.organization_id]) {
        orgStats[evt.organization_id] = { org_name: evt.org_name, events: {} };
      }
      if (!orgStats[evt.organization_id].events[evt.event_type]) {
        orgStats[evt.organization_id].events[evt.event_type] = new Date(evt.created_at).getTime();
        
        if (funnel[evt.event_type as keyof typeof funnel] !== undefined) {
          funnel[evt.event_type as keyof typeof funnel]++;
        }
      }
    }

    const ttvData = [];
    const ttaData = [];

    for (const orgId in orgStats) {
      const stats = orgStats[orgId].events;
      const start = stats['onboarding_started'];
      if (!start) continue;

      if (stats['first_incident_created']) {
        const ttvMs = stats['first_incident_created'] - start;
        ttvData.push(ttvMs);
      }

      if (stats['first_playbook_run']) {
        const ttaMs = stats['first_playbook_run'] - start;
        ttaData.push(ttaMs);
      }
    }

    const avgTtv = ttvData.length ? ttvData.reduce((a, b) => a + b, 0) / ttvData.length : 0;
    const avgTta = ttaData.length ? ttaData.reduce((a, b) => a + b, 0) / ttaData.length : 0;

    return NextResponse.json({
      funnel,
      metrics: {
        avgTtvMs: avgTtv,
        avgTtaMs: avgTta,
        activeOrgs: Object.keys(orgStats).length
      }
    });

  } catch (error) {
    console.error('Beta Admin Error:', error);
    return NextResponse.json({ error: 'Failed to fetch telemetry' }, { status: 500 });
  }
}
