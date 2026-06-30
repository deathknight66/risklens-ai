import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyPilotToken } from '@/lib/hmac';
import crypto from 'crypto';

const EVENT_WEIGHTS: Record<string, number> = {
  viewed_champion_kit: 5,
  downloaded_pdf: 15,
  opened_procurement_pack: 25,
  viewed_pricing_page: 30,
  viewed_roi_section: 10,
  viewed_security_model: 10,
  copied_share_link: 20,
  forwarded_reference_case: 20
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orgId, sig, eventType } = body;

    if (!orgId || !sig || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!verifyPilotToken(sig, orgId)) {
      return NextResponse.json({ error: 'Invalid or expired signature' }, { status: 403 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const dayBucket = new Date().toISOString().split('T')[0];
    
    // Actor fingerprinting
    const actorHash = crypto.createHash('sha256').update(`${ip}:${userAgent}:${dayBucket}`).digest('hex');

    const weight = EVENT_WEIGHTS[eventType] || 1;
    const now = new Date().toISOString();

    // 6-hour Dedupe
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    
    const existing = db.prepare(`
      SELECT id FROM deal_engagement_events 
      WHERE organization_id = ? AND actor_hash = ? AND event_type = ? AND created_at > ?
      LIMIT 1
    `).get(orgId, actorHash, eventType, sixHoursAgo);

    if (existing) {
      return NextResponse.json({ status: 'ignored_dedupe' });
    }

    db.prepare(`
      INSERT INTO deal_engagement_events (id, organization_id, actor_hash, event_type, weight, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(crypto.randomBytes(8).toString('hex'), orgId, actorHash, eventType, weight, now);

    return NextResponse.json({ status: 'recorded' });

  } catch (error: any) {
    console.error('Engagement Telemetry Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
