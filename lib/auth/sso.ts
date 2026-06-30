import crypto from 'crypto';
import db from '@/lib/db';

export interface SSOSession {
  sessionId: string;
  userId: string;
  email: string;
  orgId: string;
}

/**
 * Mocks the BoxyHQ Jackson SAML flow for Enterprise SSO.
 */
export const SSOProvider = {
  /**
   * Simulates generating a SAML authentication request (SP-initiated flow)
   * In a real implementation, this interacts with Jackson's /api/v1/sso endpoint.
   */
  createSAMLRequest: (orgSlug: string, email?: string) => {
    const org = db.prepare('SELECT id FROM organizations WHERE slug = ?').get(orgSlug) as any;
    if (!org) {
      throw new Error("Organization not found.");
    }

    const idp = db.prepare('SELECT * FROM identity_providers WHERE organization_id = ? AND status = ?').get(org.id, 'active') as any;
    if (!idp) {
      throw new Error("Single Sign-On is not configured for this organization.");
    }

    if (email && !email.endsWith(`@${idp.domain}`)) {
      throw new Error(`Domain mismatch. This organization requires a @${idp.domain} email.`);
    }

    // Generate a mock SAML AuthNRequest ID (Nonce)
    const requestId = `saml_req_${crypto.randomBytes(12).toString('hex')}`;

    // Return the URL where the user should be redirected (IdP Login Page Mock)
    return {
      redirectUrl: `/api/sso/mock-idp?requestId=${requestId}&orgId=${org.id}&domain=${idp.domain}`,
      requestId
    };
  },

  /**
   * Simulates verifying a SAML Assertion and executing JIT Provisioning.
   * In a real implementation, Jackson verifies the XML signature and returns the profile.
   */
  verifySAMLAssertion: (assertionToken: string): SSOSession => {
    // We mock the verification by assuming the token contains base64 encoded data from our Mock IdP
    try {
      const payload = JSON.parse(Buffer.from(assertionToken, 'base64').toString('utf-8'));
      
      const { email, orgId, nonce } = payload;
      if (!email || !orgId) {
        throw new Error("Invalid SAML Assertion");
      }

      const idp = db.prepare('SELECT * FROM identity_providers WHERE organization_id = ? AND status = ?').get(orgId, 'active') as any;
      if (!idp || !email.endsWith(`@${idp.domain}`)) {
        throw new Error("Domain mismatch or IdP not active.");
      }

      // Just-In-Time (JIT) Provisioning
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      
      if (!user) {
        // Create user
        const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
        // Random secure password since they use SSO
        const randomPass = crypto.randomBytes(32).toString('hex');
        db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
          userId, email, randomPass, new Date().toISOString()
        );
        user = { id: userId, email };
      }

      // Check membership
      const membership = db.prepare('SELECT * FROM memberships WHERE user_id = ? AND organization_id = ?').get(user.id, orgId);
      if (!membership) {
        // Create membership
        db.prepare('INSERT INTO memberships (id, user_id, organization_id, role) VALUES (?, ?, ?, ?)').run(
          `mem_${crypto.randomBytes(8).toString('hex')}`, user.id, orgId, 'SOC Analyst'
        );
      }

      // Track SSO Session
      const sessionId = `sso_${crypto.randomBytes(8).toString('hex')}`;
      db.prepare('INSERT INTO sso_sessions (id, user_id, organization_id, idp_id, login_at) VALUES (?, ?, ?, ?, ?)').run(
        sessionId, user.id, orgId, idp.id, new Date().toISOString()
      );

      return {
        sessionId,
        userId: user.id,
        email: user.email,
        orgId
      };

    } catch (e: any) {
      throw new Error(`SAML Verification Failed: ${e.message}`);
    }
  }
};
