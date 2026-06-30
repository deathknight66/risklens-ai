import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { normalizeEvent } from '@/lib/engine/normalizer';
import { runDetectionRules } from '@/lib/engine/rules';
import { groupAlertsIntoIncident } from '@/lib/engine/aggregator';
import { generateId } from '@/lib/engine/types';
import { recordUsage } from '@/lib/engine/metering';
import { checkQuota } from '@/lib/billing/quota';

export const dynamic = 'force-dynamic';

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const limitWindow = 60000; // 1 minute
  const maxReq = 100;
  
  const record = db.prepare('SELECT * FROM rate_limits WHERE key_hash = ?').get(key) as any;
  if (!record) {
    db.prepare('INSERT INTO rate_limits (key_hash, count, reset_at) VALUES (?, 1, ?)').run(key, now + limitWindow);
    return true;
  }
  
  if (now > record.reset_at) {
    db.prepare('UPDATE rate_limits SET count = 1, reset_at = ? WHERE key_hash = ?').run(now + limitWindow, key);
    return true;
  }
  
  if (record.count >= maxReq) {
    return false;
  }
  
  db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key_hash = ?').run(key);
  return true;
}

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized. x-api-key header missing.' }, { status: 401 });
    }

    const keyRecord = db.prepare('SELECT * FROM api_keys WHERE key_hash = ? AND status = ? AND revoked_at IS NULL').get(apiKey, 'active') as any;
    if (!keyRecord || (keyRecord.scope !== 'ingest_only' && keyRecord.scope !== 'admin_full')) {
      return NextResponse.json({ error: 'Unauthorized or invalid scope.' }, { status: 403 });
    }

    const orgId = keyRecord.organization_id;

    if (!checkRateLimit(apiKey)) {
      return NextResponse.json({ error: 'Rate limit exceeded (100 req/min).' }, { status: 429 });
    }

    db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').run(new Date().toISOString(), keyRecord.id);

    const data = await request.json();
    const rawLogs = data.logs;
    const sourceType: string = data.sourceType || 'json';

    if (!rawLogs || (typeof rawLogs === 'string' && rawLogs.trim() === '') || (Array.isArray(rawLogs) && rawLogs.length === 0)) {
      return NextResponse.json({ error: 'No logs provided' }, { status: 400 });
    }

    // 1. Parse into individual log lines (if it's a bulk text upload)
    let rawLines: string[] = [];
    if (typeof rawLogs === 'string') {
      rawLines = rawLogs.split('\n').filter(line => line.trim().length > 0);
    } else if (Array.isArray(rawLogs)) {
      rawLines = rawLogs.map(log => typeof log === 'string' ? log : JSON.stringify(log));
    }
    
    // Hash-based Deduplication to prevent flood
    const uniqueMap = new Map();
    for (const line of rawLines) {
      const hash = crypto.createHash('sha256').update(line).digest('hex');
      if (!uniqueMap.has(hash)) {
        uniqueMap.set(hash, line);
      }
    }
    const logLines = Array.from(uniqueMap.values());
    
    // 2. Normalize
    const normalizedLogs = logLines.map(line => normalizeEvent(line, sourceType));

    // Cross-request payload deduplication (5 minute window)
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(normalizedLogs.map(l => l.payload))).digest('hex');
    const existingReq = db.prepare('SELECT count FROM rate_limits WHERE key_hash = ?').get('dedup_' + payloadHash) as any;
    if (existingReq) {
      // Refresh the expiration
      db.prepare('UPDATE rate_limits SET reset_at = ? WHERE key_hash = ?').run(Date.now() + 300000, 'dedup_' + payloadHash);
      return NextResponse.json({ 
        success: true, 
        summary: { logsParsed: normalizedLogs.length, alertsDetected: 0, incidentsCreated: 0, deduplicated: true } 
      });
    }
    db.prepare('INSERT INTO rate_limits (key_hash, count, reset_at) VALUES (?, 1, ?)').run('dedup_' + payloadHash, Date.now() + 300000);

    // 3. Detect Alerts
    const alerts = runDetectionRules(normalizedLogs);

    // 4. Aggregate Incidents
    const incidents = groupAlertsIntoIncident(alerts);

    // 5. Store in DB
    const insertLog = db.prepare(`
      INSERT OR IGNORE INTO logs (id, organization_id, timestamp, source_ip, target, event_type, status, payload, source_type, raw_log)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAlert = db.prepare(`
      INSERT OR IGNORE INTO alerts (id, organization_id, rule_name, severity, confidence, timestamp, source_ip, target, description, mitre_technique)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertIncident = db.prepare(`
      INSERT OR IGNORE INTO incidents (id, organization_id, title, severity, status, created_at, updated_at, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const linkIncidentAlert = db.prepare(`
      INSERT OR IGNORE INTO incident_alerts (incident_id, alert_id)
      VALUES (?, ?)
    `);

    db.transaction(() => {
      // Save Logs
      for (const log of normalizedLogs) {
        insertLog.run(
          log.id,
          orgId,
          log.timestamp, 
          log.sourceIP || null, 
          log.target || null, 
          log.eventType, 
          log.status, 
          log.payload, 
          log.sourceType, 
          log.rawLog
        );
      }

      // Save Alerts
      for (const alert of alerts) {
        insertAlert.run(
          alert.id,
          orgId,
          alert.ruleName,
          alert.severity,
          alert.confidence,
          alert.timestamp,
          alert.sourceIP || null,
          alert.target || null,
          alert.description,
          alert.technique
        );
      }

      // Save Incidents
      for (const inc of incidents) {
        insertIncident.run(
          inc.id,
          orgId,
          inc.title,
          inc.severity,
          inc.status,
          inc.createdAt,
          inc.createdAt, // updated_at
          `Detected ${inc.alerts.length} associated alerts.`
        );

        // Link Alerts to Incident
        for (const al of inc.alerts) {
          linkIncidentAlert.run(inc.id, al.id);
        }
      }
    })();

    recordUsage(orgId, 'logs_ingested', normalizedLogs.length);

    // Beta Telemetry
    const { BetaTelemetry } = require('@/lib/engine/telemetry');
    if (normalizedLogs.length > 0 && !BetaTelemetry.hasTracked(orgId, 'first_log_ingested')) {
       BetaTelemetry.track(orgId, 'first_log_ingested', undefined, undefined, { count: normalizedLogs.length, sourceType });
    }
    if (incidents.length > 0 && !BetaTelemetry.hasTracked(orgId, 'first_incident_created')) {
       BetaTelemetry.track(orgId, 'first_incident_created', undefined, undefined, { title: incidents[0].title });
    }

    return NextResponse.json({
      success: true,
      summary: {
        logsParsed: normalizedLogs.length,
        alertsDetected: alerts.length,
        incidentsCreated: incidents.length
      }
    });

  } catch (error: any) {
    console.error('Ingestion Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
