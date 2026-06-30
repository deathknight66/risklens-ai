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
    const destinations = db.prepare('SELECT * FROM destinations WHERE organization_id = ? ORDER BY created_at DESC').all(activeOrg);
    return NextResponse.json({ destinations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 });
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
    const { name, type, webhookUrl } = await req.json();

    if (!name || !type || !webhookUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = `dst_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO destinations (id, organization_id, name, type, webhook_url, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `).run(id, activeOrg, name, type, webhookUrl, now);

    return NextResponse.json({ success: true, destination: { id, name, type, webhook_url: webhookUrl, status: 'active', created_at: now } });
  } catch (error) {
    console.error('Failed to create destination:', error);
    return NextResponse.json({ error: 'Failed to create destination' }, { status: 500 });
  }
}
