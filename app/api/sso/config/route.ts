import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeOrg = (session.user as any).activeOrganizationId;
  const role = (session.user as any).role;

  if (role !== 'Org Admin') {
    return NextResponse.json({ error: 'Forbidden. Only Org Admins can configure SSO.' }, { status: 403 });
  }

  try {
    const { domain, providerType, metadataUrl } = await req.json();

    if (!domain || !providerType) {
      return NextResponse.json({ error: 'Domain and Provider Type are required' }, { status: 400 });
    }

    const idpId = `idp_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    // Check if domain is already in use
    const existing = db.prepare('SELECT * FROM identity_providers WHERE domain = ?').get(domain) as any;
    if (existing && existing.organization_id !== activeOrg) {
      return NextResponse.json({ error: 'Domain is already registered to another organization.' }, { status: 409 });
    }

    db.prepare(`
      INSERT INTO identity_providers (id, organization_id, provider_type, domain, metadata_url, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(organization_id) DO UPDATE SET
        provider_type = excluded.provider_type,
        domain = excluded.domain,
        metadata_url = excluded.metadata_url,
        status = 'active'
    `).run(idpId, activeOrg, providerType, domain, metadataUrl || null, 'active', now);

    return NextResponse.json({ success: true, idpId });

  } catch (error) {
    console.error('Configure SSO error:', error);
    return NextResponse.json({ error: 'Failed to configure SSO' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeOrg = (session.user as any).activeOrganizationId;
  
  const idp = db.prepare('SELECT * FROM identity_providers WHERE organization_id = ?').get(activeOrg);
  
  return NextResponse.json(idp || {});
}
