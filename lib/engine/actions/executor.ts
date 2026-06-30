import db from '@/lib/db';
import { getAdapterForAction } from '@/lib/engine/decision';
import crypto from 'crypto';

export async function executeAction(actionId: string, approvedBy: string): Promise<{ success: boolean; response?: any; error?: string; details?: string }> {
  // 1. Idempotency Lock (Atomic Update)
  const result = db.prepare(`
    UPDATE actions 
    SET status = ?, approved_by = ?, updated_at = ? 
    WHERE id = ? AND status IN ('Awaiting Approval', 'AI Suggested')
  `).run(
    'Executing',
    approvedBy,
    new Date().toISOString(),
    actionId
  );

  if (result.changes === 0) {
    return { success: false, error: 'Action is already executing, completed, or not found' };
  }

  // We got the lock. Fetch the action details for the adapter
  const action: any = db.prepare('SELECT * FROM actions WHERE id = ?').get(actionId);

  // 2. Fetch the adapter
  const adapter = getAdapterForAction(action.action_type);
  if (!adapter) {
    db.prepare('UPDATE actions SET status = ? WHERE id = ?').run('Failed', actionId);
    return { success: false, error: 'No adapter found for action type' };
  }

  // 3. Execution Delay Simulation (Backend-managed)
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Execute adapter
  const response = await adapter.execute(action.target, { type: action.action_type === 'Force MFA' ? 'force_mfa' : 'default' });

  if (response.success) {
    const executedAt = new Date().toISOString();
    // Calculate rollback expiry (e.g. 7 days from now)
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    const executionHash = crypto.createHash('sha256').update(action.incident_id + action.action_type + action.target + executedAt).digest('hex');

    db.prepare(`
      UPDATE actions SET 
        status = ?, 
        rollback_payload = ?, 
        executed_at = ?, 
        rollback_expires_at = ?,
        execution_hash = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      'Executed',
      response.rollbackPayload ? JSON.stringify(response.rollbackPayload) : null,
      executedAt,
      expiry.toISOString(),
      executionHash,
      new Date().toISOString(),
      actionId
    );

    return { success: true, response };
  } else {
    db.prepare('UPDATE actions SET status = ?, updated_at = ? WHERE id = ?').run('Failed', new Date().toISOString(), actionId);
    return { success: false, error: 'Execution failed', details: response.error };
  }
}
