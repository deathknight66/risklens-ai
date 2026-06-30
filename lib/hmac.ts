import crypto from 'crypto';

const SECRET_KEY = process.env.HMAC_SECRET || 'dev_hmac_secret_key_risklens_ai_123';

export function generatePilotToken(orgId: string, expiresInDays = 14): { token: string, expiresAt: number } {
  const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  
  const payload = `${orgId}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  const token = Buffer.from(`${payload}:${signature}`).toString('base64');
  return { token, expiresAt };
}

export function verifyPilotToken(token: string, orgId: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;

    const [tokenOrgId, expiresAtStr, signature] = parts;
    if (tokenOrgId !== orgId) return false;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (Date.now() > expiresAt) return false;

    const payload = `${orgId}:${expiresAt}`;
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (err) {
    return false;
  }
}
