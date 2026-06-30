import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

// Authenticates SCIM requests using an admin_full API Key
function authenticateSCIM(req: Request): any {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  const keyRecord = db.prepare('SELECT * FROM api_keys WHERE key_hash = ? AND status = ? AND scope = ?').get(token, 'active', 'admin_full') as any;
  
  if (!keyRecord) return null;

  return keyRecord;
}

export async function POST(req: Request) {
  const keyRecord = authenticateSCIM(req);
  if (!keyRecord) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const orgId = keyRecord.organization_id;
    const body = await req.json();

    const email = body.emails?.find((e: any) => e.primary)?.value || body.userName;
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const idp = db.prepare('SELECT * FROM identity_providers WHERE organization_id = ? AND status = ?').get(orgId, 'active') as any;
    if (!idp || !email.endsWith(`@${idp.domain}`)) {
      return NextResponse.json({ error: "Domain mismatch" }, { status: 403 });
    }

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    
    if (!user) {
      const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
      const randomPass = crypto.randomBytes(32).toString('hex');
      db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
        userId, email, randomPass, new Date().toISOString()
      );
      user = { id: userId, email };
    }

    const membership = db.prepare('SELECT * FROM memberships WHERE user_id = ? AND organization_id = ?').get(user.id, orgId);
    if (!membership) {
      db.prepare('INSERT INTO memberships (id, user_id, organization_id, role) VALUES (?, ?, ?, ?)').run(
        `mem_${crypto.randomBytes(8).toString('hex')}`, user.id, orgId, 'SOC Analyst'
      );
    }

    const response = {
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
      id: user.id,
      userName: user.email,
      emails: [{ primary: true, value: user.email }],
      active: true
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('SCIM Create User Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
