import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const invite = db.prepare(`
    SELECT invitations.email, organizations.name as org_name, invitations.status, invitations.expires_at
    FROM invitations 
    JOIN organizations ON invitations.organization_id = organizations.id
    WHERE token_hash = ?
  `).get(tokenHash) as any;

  if (!invite) {
    return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
  }

  if (invite.status !== 'pending') {
    return NextResponse.json({ error: 'Invitation is no longer valid', status: invite.status }, { status: 400 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
  }

  return NextResponse.json({ email: invite.email, orgName: invite.org_name });
}
