import db from '@/lib/db';

export class IncidentRepository {
  // Phase 4.4 will inject orgId into all these queries.
  // For Phase 4.37, we stub the tenant logic.

  static getIncidentById(id: string, orgId?: string) {
    let query = 'SELECT * FROM incidents WHERE id = ?';
    // if (orgId) query += ' AND org_id = ?';
    return db.prepare(query).get(id);
  }

  static getIncidents(orgId?: string) {
    let query = 'SELECT * FROM incidents ORDER BY created_at DESC';
    return db.prepare(query).all();
  }

  static getAlertsForIncident(incidentId: string, orgId?: string) {
    return db.prepare(`
      SELECT a.* 
      FROM alerts a
      JOIN incident_alerts ia ON a.id = ia.alert_id
      WHERE ia.incident_id = ?
    `).all(incidentId);
  }

  static getActionsForIncident(incidentId: string, orgId?: string) {
    return db.prepare(`
      SELECT * FROM actions WHERE incident_id = ? ORDER BY created_at DESC
    `).all(incidentId);
  }
}
