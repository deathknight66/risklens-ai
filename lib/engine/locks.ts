import db from '@/lib/db';

export class ResourceLocks {
  
  /**
   * Attempts to acquire a lock for a given target. 
   * A target is only locked if no active lock exists, or if the active lock has expired.
   */
  static acquireLock(organizationId: string, runId: string, target: string, timeoutMinutes: number = 10): boolean {
    const now = new Date();
    
    // Clean up expired locks first
    try {
      db.prepare('DELETE FROM resource_locks WHERE expires_at < ?').run(now.toISOString());
    } catch (e) {
      console.error("Failed to clean up expired locks:", e);
    }

    try {
      const expiresAt = new Date(now.getTime() + timeoutMinutes * 60000).toISOString();
      db.prepare(`
        INSERT INTO resource_locks (target, organization_id, run_id, locked_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(target, organizationId, runId, now.toISOString(), expiresAt);
      return true;
    } catch (e: any) {
      // UNIQUE constraint failed - lock is currently held by someone else
      if (e.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        return false; 
      }
      console.error("Lock acquisition error:", e);
      return false;
    }
  }

  static releaseLock(target: string) {
    try {
      db.prepare('DELETE FROM resource_locks WHERE target = ?').run(target);
    } catch (e) {
      console.error("Failed to release lock:", e);
    }
  }

  /**
   * Idempotency Check
   * Generates a deterministic key based on the incident, playbook, and organization.
   * If the key already exists, returns false to prevent double-execution.
   */
  static checkIdempotency(organizationId: string, playbookId: string, incidentId: string): string | null {
    const key = `pb_exec_${organizationId}_${playbookId}_${incidentId}`;
    const existing = db.prepare('SELECT id FROM playbook_runs WHERE execution_key = ?').get(key);
    
    if (existing) {
       return null; // Block execution
    }
    
    return key;
  }
}
