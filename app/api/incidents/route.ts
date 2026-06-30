import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.activeOrganizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const orgId = session.user.activeOrganizationId;

    const incidents = db.prepare('SELECT * FROM incidents WHERE organization_id = ? AND deleted_at IS NULL ORDER BY created_at DESC').all(orgId);
    
    const alertsStmt = db.prepare(`
      SELECT a.* 
      FROM alerts a
      JOIN incident_alerts ia ON a.id = ia.alert_id
      WHERE ia.incident_id = ?
    `);

    const result = incidents.map((incident: any) => {
      const alerts = alertsStmt.all(incident.id);
      
      // Parse JSON fields if they are strings
      let timeline_json = incident.timeline_json;
      let mitre_tactics = incident.mitre_tactics;
      let root_cause_tree = incident.root_cause_tree;

      try { if (timeline_json) timeline_json = JSON.parse(timeline_json); } catch (e) {}
      try { if (mitre_tactics) mitre_tactics = JSON.parse(mitre_tactics); } catch (e) {}
      try { if (root_cause_tree) root_cause_tree = JSON.parse(root_cause_tree); } catch (e) {}

      return {
        ...incident,
        timeline_json,
        mitre_tactics,
        root_cause_tree,
        alerts
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}
