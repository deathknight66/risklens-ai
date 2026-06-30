import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeOrg = (session.user as any).activeOrganizationId;

  try {
    const keys = db.prepare(`
      SELECT id, scope, status, created_by, created_at, last_used_at, expires_at 
      FROM api_keys 
      WHERE organization_id = ? AND status = 'active'
      ORDER BY created_at DESC
    `).all(activeOrg);

    return NextResponse.json(keys);
  } catch (error) {
    console.error('List keys error:', error);
    return NextResponse.json({ error: 'Failed to list keys' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeOrg = (session.user as any).activeOrganizationId;
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role !== 'Org Admin') {
    return NextResponse.json({ error: 'Forbidden. Only Org Admins can generate API keys.' }, { status: 403 });
  }

  try {
    const { scope } = await req.json();

    if (!['ingest_only', 'admin_full'].includes(scope)) {
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
    }

    const rawApiKey = `rl_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
    const keyId = `key_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO api_keys (id, organization_id, key_hash, scope, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      keyId, activeOrg, keyHash, scope, 'active', userId, now
    );

    db.prepare('INSERT INTO auth_logs (id, organization_id, user_id, ip, user_agent, login_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      `log_${crypto.randomBytes(8).toString('hex')}`, activeOrg, userId, 'api', 'dashboard', now, 'api_key_generated'
    );

    return NextResponse.json({ 
      id: keyId,
      rawKey: rawApiKey,
      scope,
      createdAt: now
    });

  } catch (error) {
    console.error('Generate key error:', error);
    return NextResponse.json({ error: 'Failed to generate key' }, { status: 500 });
  }
}
