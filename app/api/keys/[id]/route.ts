import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';
import crypto from 'crypto';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeOrg = (session.user as any).activeOrganizationId;
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role !== 'Org Admin') {
    return NextResponse.json({ error: 'Forbidden. Only Org Admins can revoke API keys.' }, { status: 403 });
  }

  try {
    const keyId = params.id;
    const now = new Date().toISOString();

    const info = db.prepare('UPDATE api_keys SET status = ?, revoked_at = ? WHERE id = ? AND organization_id = ?').run(
      'revoked', now, keyId, activeOrg
    );

    if (info.changes === 0) {
      return NextResponse.json({ error: 'Key not found or already revoked' }, { status: 404 });
    }

    db.prepare('INSERT INTO auth_logs (id, organization_id, user_id, ip, user_agent, login_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      `log_${crypto.randomBytes(8).toString('hex')}`, activeOrg, userId, 'api', 'dashboard', now, 'api_key_revoked'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke key error:', error);
    return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 });
  }
}
