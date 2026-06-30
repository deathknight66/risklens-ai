import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';
import crypto from 'crypto';
import { checkQuota } from '@/lib/billing/quota';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeOrg = (session.user as any).activeOrganizationId;
  const role = (session.user as any).role;

  if (role !== 'Org Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const invites = db.prepare(`
    SELECT id, email, role, status, created_at, expires_at, invited_by 
    FROM invitations 
    WHERE organization_id = ? 
    ORDER BY created_at DESC
  `).all(activeOrg);

  return NextResponse.json({ invitations: invites });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeOrg = (session.user as any).activeOrganizationId;
  const role = (session.user as any).role;
  const inviterId = (session.user as any).id;
  const inviterEmail = session.user.email;

  if (role !== 'Org Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { email: rawEmail, role: inviteRole } = await req.json();
    if (!rawEmail || !inviteRole) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Hardening B: Email normalization
    const email = rawEmail.trim().toLowerCase();

    // Hardening C: Self-invite guard
    if (email === inviterEmail?.toLowerCase()) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }

    // Check if user is already a member
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
    if (existingUser) {
      const existingMembership = db.prepare('SELECT id FROM memberships WHERE user_id = ? AND organization_id = ?').get(existingUser.id, activeOrg);
      if (existingMembership) {
        return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 409 });
      }
    }

    // Hardening A: Prevent duplicate pending invites
    const existingInvite = db.prepare(`
      SELECT id, token_hash FROM invitations 
      WHERE organization_id = ? AND email = ? AND status = 'pending' AND expires_at > ?
    `).get(activeOrg, email, new Date().toISOString()) as any;

    if (existingInvite) {
      return NextResponse.json({ error: 'A pending invitation already exists for this email' }, { status: 409 });
    }

    // Hardening B: Seat count validation
    const quota = await checkQuota(activeOrg, 'seats', 1);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 402 }); // 402 Payment Required
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Hardening E: Token hashing
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const inviteId = `inv_${crypto.randomBytes(8).toString('hex')}`;
    
    // Hardening G: Expiry window
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    db.prepare(`
      INSERT INTO invitations (id, organization_id, email, role, token_hash, invited_by, status, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(inviteId, activeOrg, email, inviteRole, tokenHash, inviterId, new Date().toISOString(), expiresAt.toISOString());

    // Hardening F: Audit trail
    db.prepare('INSERT INTO auth_logs (id, organization_id, user_id, ip, user_agent, login_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      `log_${crypto.randomBytes(8).toString('hex')}`,
      activeOrg,
      inviterId,
      'invite_api',
      'invite_api',
      new Date().toISOString(),
      `invitation_created:${email}:${inviteRole}`
    );

    // Return the raw token in the link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;

    return NextResponse.json({ inviteLink, id: inviteId });

  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
