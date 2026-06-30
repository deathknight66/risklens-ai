import db from '@/lib/db';
import crypto from 'crypto';

export type BetaEventType = 
  // Core Onboarding & Activation
  | 'onboarding_started'
  | 'pack_selected'
  | 'api_key_generated'
  | 'first_log_ingested'
  | 'first_incident_created'
  | 'first_ai_analysis'
  | 'first_playbook_run'
  | 'first_destination_connected'
  // Drop-off / Churn Risk
  | 'onboarding_abandoned'
  | 'api_key_revoked_without_ingest'
  | 'no_logs_after_24h'
  | 'no_analysis_after_72h'
  // Behavior / Value Tuning
  | 'false_positive_marked'
  | 'manual_override_triggered'
  | 'playbook_rollback_triggered';

export class BetaTelemetry {
  /**
   * Tracks a beta telemetry event in the internal SQLite database.
   */
  static track(
    organizationId: string, 
    eventType: BetaEventType, 
    userId?: string, 
    sessionId?: string, 
    metadata?: Record<string, any>
  ) {
    try {
      const id = `evt_${crypto.randomBytes(8).toString('hex')}`;
      
      db.prepare(`
        INSERT INTO beta_events (id, organization_id, user_id, session_id, event_type, metadata_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, 
        organizationId, 
        userId || null, 
        sessionId || null, 
        eventType, 
        metadata ? JSON.stringify(metadata) : null, 
        new Date().toISOString()
      );
    } catch (e) {
      // Fail silently to avoid interrupting user flows, but log to server
      console.error(`[TELEMETRY] Failed to track event ${eventType}:`, e);
    }
  }

  /**
   * Safe-guard: Check if a "first_time" event has already been recorded for this org
   * to avoid flooding the table (e.g. tracking first_log_ingested on every log)
   */
  static hasTracked(organizationId: string, eventType: BetaEventType): boolean {
    try {
      const result = db.prepare(`SELECT 1 FROM beta_events WHERE organization_id = ? AND event_type = ? LIMIT 1`).get(organizationId, eventType);
      return !!result;
    } catch {
      return false;
    }
  }
}
