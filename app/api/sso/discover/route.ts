import { NextResponse } from 'next/server';
import { SSOProvider } from '@/lib/auth/sso';
import db from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const identifier = searchParams.get('identifier')?.trim().toLowerCase();

  if (!identifier) {
    return NextResponse.json({ error: 'Identifier is required' }, { status: 400 });
  }

  try {
    let orgSlug = identifier;
    let email: string | undefined = undefined;

    // If it's an email, find the organization mapped to that domain
    if (identifier.includes('@')) {
      email = identifier;
      const domain = identifier.split('@')[1];
      const idp = db.prepare('SELECT * FROM identity_providers WHERE domain = ? AND status = ?').get(domain, 'active') as any;
      
      if (!idp) {
        return NextResponse.json({ error: 'No active SSO configuration found for this domain.' }, { status: 404 });
      }

      const org = db.prepare('SELECT slug FROM organizations WHERE id = ?').get(idp.organization_id) as any;
      if (!org) {
        return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
      }

      orgSlug = org.slug;
    }

    // Call our Mock SSO Provider to generate the redirect URL
    const { redirectUrl } = SSOProvider.createSAMLRequest(orgSlug, email);

    return NextResponse.json({ redirectUrl });

  } catch (error: any) {
    console.error('SSO Discovery Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
