import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { normalizeEvent } from '@/lib/engine/normalizer';
import { runDetectionRules } from '@/lib/engine/rules';
import { groupAlertsIntoIncident } from '@/lib/engine/aggregator';
import { generateId } from '@/lib/engine/types';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const rawLogs: string = data.logs || '';
    const sourceType: string = data.sourceType || 'unknown';

    if (!rawLogs) {
      return NextResponse.json({ error: 'No logs provided' }, { status: 400 });
    }

    // 1. Parse into individual log lines (if it's a bulk text upload)
    const logLines = rawLogs.split('\n').filter(line => line.trim().length > 0);
    
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
