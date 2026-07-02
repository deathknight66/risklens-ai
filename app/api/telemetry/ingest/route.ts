import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import { generateEventFingerprint } from '../../../../lib/telemetry/dedupe';
import { calculateIntegrityScore, classifyIntegrity } from '../../../../lib/telemetry/integrity';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { organization_id, source_connector, actor, target, event_type, severity, timestamp, raw_payload } = payload;

    const db = new Database(dbPath);

    // 1. Generate Fingerprint (Dedupe Engine)
    const eventHash = generateEventFingerprint({
      source_connector,
      actor,
      target,
      event_type,
      severity,
      timestamp: timestamp || new Date().toISOString()
    });

    // 2. Check for Duplicates
    const existing = db.prepare('SELECT id FROM telemetry_events WHERE event_hash = ? AND organization_id = ?').get(eventHash, organization_id) as any;
    
    // 3. Calculate Integrity Score
    const deduplicationConfidence = existing ? 0.0 : 1.0;
    const payloadCompleteness = (actor && target && event_type && severity) ? 1.0 : 0.5;
    const sourceReliability = source_connector ? 0.9 : 0.4;
    
    // For ingest, we don't know the execution confirmation yet, we just score the initial telemetry.
    const integrityScore = calculateIntegrityScore({
      sourceReliability,
      payloadCompleteness,
      deduplicationConfidence,
      hasContainedAt: false,
      rollbackUsed: false,
      postActionVerification: false
    });

    const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // 4. Ingest Event
    db.prepare(`
      INSERT INTO telemetry_events 
      (id, organization_id, connector_id, source_type, event_hash, raw_payload, ingested_at, integrity_score, duplicate_of, simulation_flag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      eventId,
      organization_id,
      source_connector,
      'webhook',
      eventHash,
      JSON.stringify(raw_payload || payload),
      new Date().toISOString(),
      integrityScore,
      existing ? existing.id : null
    );

    return NextResponse.json({ 
      success: true, 
      event_id: eventId, 
      status: existing ? 'duplicate' : 'processed',
      integrity_score: integrityScore,
      classification: classifyIntegrity(integrityScore)
    });

  } catch (error: any) {
    console.error('Ingest POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
