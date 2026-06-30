import { NextResponse } from 'next/server';
import db from '@/lib/db';
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

    const actions = db.prepare(`
      SELECT a.*, i.title as incident_title, i.severity as incident_severity
      FROM actions a
      JOIN incidents i ON a.incident_id = i.id
      WHERE a.organization_id = ? AND a.deleted_at IS NULL
      ORDER BY a.created_at DESC
    `).all(orgId);

    return NextResponse.json({ success: true, actions });
  } catch (error: any) {
    console.error('Error fetching actions:', error);
    return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
  }
}
