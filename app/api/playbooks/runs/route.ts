import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const activeOrg = (session.user as any).activeOrganizationId;

  try {
    const runs = db.prepare(`
      SELECT r.*, p.name as playbook_name 
      FROM playbook_runs r
      JOIN playbooks p ON r.playbook_id = p.id
      WHERE r.organization_id = ? 
      ORDER BY r.started_at DESC LIMIT 50
    `).all(activeOrg);
    return NextResponse.json({ runs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch playbook runs' }, { status: 500 });
  }
}
