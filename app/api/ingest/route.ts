import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { normalizeEvent } from '@/lib/engine/normalizer';
import { runDetectionRules } from '@/lib/engine/rules';
import { groupAlertsIntoIncident } from '@/lib/engine/aggregator';
import { generateId } from '@/lib/engine/types';

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

    const keyRecord = db.prepare('SELECT * FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL').get(apiKey) as any;
    if (!keyRecord || (keyRecord.scope !== 'ingest_only' && keyRecord.scope !== 'admin_full')) {
      return NextResponse.json({ error: 'Unauthorized or invalid scope.' }, { status: 403 });
    }

    if (!checkRateLimit(apiKey)) {
      return NextResponse.json({ error: 'Rate limit exceeded (100 req/min).' }, { status: 429 });
    }

    db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').run(new Date().toISOString(), keyRecord.id);

    const data = await request.json();
    const rawLogs: string = data.logs || '';
    const sourceType: string = data.sourceType || 'unknown';

    if (!rawLogs) {
      return NextResponse.json({ error: 'No logs provided' }, { status: 400 });
    }

    // 1. Parse into individual log lines (if it's a bulk text upload)
    const rawLines = rawLogs.split('\n').filter(line => line.trim().length > 0);
    
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

    // 3. Detect Alerts
    const alerts = runDetectionRules(normalizedLogs);

    // 4. Aggregate Incidents
    const incidents = groupAlertsIntoIncident(alerts);

    // 5. Store in DB
    const insertLog = db.prepare(`
      INSERT OR IGNORE INTO logs (id, timestamp, source_ip, target, event_type, status, payload, source_type, raw_log)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAlert = db.prepare(`
      INSERT OR IGNORE INTO alerts (id, rule_name, severity, confidence, timestamp, source_ip, target, description, mitre_technique)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertIncident = db.prepare(`
      INSERT OR IGNORE INTO incidents (id, title, severity, status, created_at, updated_at, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
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
