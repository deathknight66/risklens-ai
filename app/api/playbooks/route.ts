import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const activeOrg = (session.user as any).activeOrganizationId;

  try {
    const playbooks = db.prepare('SELECT * FROM playbooks WHERE organization_id = ? AND deleted_at IS NULL ORDER BY created_at DESC').all(activeOrg);
    return NextResponse.json({ playbooks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch playbooks' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const activeOrg = (session.user as any).activeOrganizationId;
  const role = (session.user as any).role;

  if (role !== 'Org Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { name, description, dag } = await req.json();

    if (!name || !dag) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = `pb_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO playbooks (id, organization_id, name, description, dag_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, activeOrg, name, description || '', JSON.stringify(dag), now, now);

    return NextResponse.json({ success: true, playbook: { id, name } });
  } catch (error) {
    console.error('Failed to create playbook:', error);
    return NextResponse.json({ error: 'Failed to create playbook' }, { status: 500 });
  }
}
