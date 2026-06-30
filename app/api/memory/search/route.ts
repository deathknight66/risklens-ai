import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { searchSimilarIncidents } from '@/lib/engine/memory';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { incidentId } = await req.json();

    if (!incidentId) {
      return NextResponse.json({ error: 'Incident ID is required' }, { status: 400 });
    }

    // Fetch the incident
    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(incidentId) as any;
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    if (!incident.ai_summary) {
      return NextResponse.json({ error: 'Incident must be analyzed by AI first' }, { status: 400 });
    }

    // Parse the stored AI analysis
    const analysisResult = {
      attackSummary: incident.ai_summary,
      rootCauseTree: incident.root_cause_tree ? JSON.parse(incident.root_cause_tree) : [],
      mitreMappings: incident.mitre_tactics ? JSON.parse(incident.mitre_tactics) : []
    };

    // Fetch logs to extract source IPs and targets
    const logs = db.prepare(`
      SELECT l.* FROM logs l
      JOIN incidents i ON l.timestamp >= datetime(i.created_at, '-10 minutes') AND l.timestamp <= datetime(i.created_at, '+10 minutes')
      WHERE i.id = ?
    `).all(incidentId);

    // Call the memory search engine
    const similarIncidents = await searchSimilarIncidents(incidentId, analysisResult, logs);

    return NextResponse.json({ success: true, similarIncidents });
  } catch (error: any) {
    console.error('Error searching memory:', error);
    return NextResponse.json({ error: 'Failed to search memory' }, { status: 500 });
  }
}
