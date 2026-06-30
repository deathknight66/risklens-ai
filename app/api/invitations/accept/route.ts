import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    // Hardening E: Token hashing validation
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invite = db.prepare(`
      SELECT * FROM invitations 
      WHERE token_hash = ? AND status = 'pending'
    `).get(tokenHash) as any;

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      db.prepare("UPDATE invitations SET status = 'expired' WHERE id = ?").run(invite.id);
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    const email = invite.email;
    const orgId = invite.organization_id;

    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (user) {
      // Existing user: verify password to authorize the accept
      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect password for existing account' }, { status: 401 });
      }
    } else {
      // New user: register them
      const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
      const passwordHash = bcrypt.hashSync(password, 10);
      
      db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
        userId, email, passwordHash, new Date().toISOString()
      );
      user = { id: userId };
    }

    // Hardening D: Membership duplicate guard
    const existingMembership = db.prepare('SELECT id FROM memberships WHERE user_id = ? AND organization_id = ?').get(user.id, orgId);
    
    if (existingMembership) {
      db.prepare("UPDATE invitations SET status = 'accepted' WHERE id = ?").run(invite.id);
      return NextResponse.json({ success: true, message: 'Already a member' });
    }

    // Create membership
    db.prepare('INSERT INTO memberships (id, user_id, organization_id, role) VALUES (?, ?, ?, ?)').run(
      `mem_${crypto.randomBytes(8).toString('hex')}`,
      user.id,
      orgId,
      invite.role
    );

    // Mark as accepted
    db.prepare("UPDATE invitations SET status = 'accepted' WHERE id = ?").run(invite.id);

    // Hardening F: Audit trail
    db.prepare('INSERT INTO auth_logs (id, organization_id, user_id, ip, user_agent, login_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      `log_${crypto.randomBytes(8).toString('hex')}`,
      orgId,
      user.id,
      'invite_api',
      'invite_api',
      new Date().toISOString(),
      `invitation_accepted:${invite.id}`
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
