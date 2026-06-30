import { NextResponse } from 'next/server';

/**
 * Mock BoxyHQ Jackson IdP Simulation Endpoint
 * In reality, Jackson redirects to the real IdP (Okta/Entra).
 * We will just simulate a successful SAML login and redirect back to our callback.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('requestId');
  const orgId = searchParams.get('orgId');
  const domain = searchParams.get('domain');

  if (!requestId || !orgId || !domain) {
    return NextResponse.json({ error: 'Missing IdP parameters' }, { status: 400 });
  }

  // Simulate an admin email from that domain authenticating via SSO
  const mockEmail = `admin@${domain}`;

  // Create a mock SAML assertion token
  const payload = {
    email: mockEmail,
    orgId,
    nonce: requestId,
    timestamp: Date.now()
  };

  const assertionToken = Buffer.from(JSON.stringify(payload)).toString('base64');

  // Redirect to our NextAuth callback with the token
  // For a real SAML setup, this would be an HTTP POST to /api/auth/callback/saml
  // Since we are mocking BoxyHQ Jackson via custom flow, we redirect to a custom callback
  const callbackUrl = new URL(`/api/sso/callback`, req.url);
  callbackUrl.searchParams.set('token', assertionToken);

  return NextResponse.redirect(callbackUrl);
}
