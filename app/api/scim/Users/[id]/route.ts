import { NextResponse } from 'next/server';
import db from '@/lib/db';

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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const keyRecord = authenticateSCIM(req);
  if (!keyRecord) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const orgId = keyRecord.organization_id;
    const userId = params.id;

    // SCIM Delete removes the membership from the org, but does not delete the user account entirely, 
    // since the user might be a part of other orgs (multi-tenant architecture).
    db.prepare('DELETE FROM memberships WHERE user_id = ? AND organization_id = ?').run(userId, orgId);

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('SCIM Delete User Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
