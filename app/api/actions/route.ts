import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actions = db.prepare(`
      SELECT a.*, i.title as incident_title, i.severity as incident_severity
      FROM actions a
      JOIN incidents i ON a.incident_id = i.id
      ORDER BY a.created_at DESC
    `).all();

    return NextResponse.json({ success: true, actions });
  } catch (error: any) {
    console.error('Error fetching actions:', error);
    return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
  }
}
