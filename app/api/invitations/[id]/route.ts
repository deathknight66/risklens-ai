import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';
import crypto from 'crypto';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeOrg = (session.user as any).activeOrganizationId;
  const role = (session.user as any).role;
  const inviterId = (session.user as any).id;

  if (role !== 'Org Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const inviteId = params.id;

  try {
    const invite = db.prepare('SELECT id, status FROM invitations WHERE id = ? AND organization_id = ?').get(inviteId, activeOrg) as any;
    
    if (!invite) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending invitations can be revoked' }, { status: 400 });
    }

    db.prepare("UPDATE invitations SET status = 'revoked' WHERE id = ?").run(inviteId);

    // Audit trail
    db.prepare('INSERT INTO auth_logs (id, organization_id, user_id, ip, user_agent, login_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      `log_${crypto.randomBytes(8).toString('hex')}`,
      activeOrg,
      inviterId,
      'invite_api',
      'invite_api',
      new Date().toISOString(),
      `invitation_revoked:${inviteId}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke error:', error);
    return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 });
  }
}
