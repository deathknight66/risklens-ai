import db from '@/lib/db';
import crypto from 'crypto';

export function recordUsage(orgId: string, metric: 'logs_ingested' | 'ai_analyses' | 'action_executions' | 'token_usage', amount: number = 1) {
  try {
    const periodMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    
    // Check if record exists
    const record = db.prepare('SELECT id FROM usage_metering WHERE organization_id = ? AND period_month = ?').get(orgId, periodMonth) as any;
    
    if (record) {
      db.prepare(`UPDATE usage_metering SET ${metric} = ${metric} + ? WHERE id = ?`).run(amount, record.id);
    } else {
      const id = `use_${crypto.randomBytes(8).toString('hex')}`;
      db.prepare(`
        INSERT INTO usage_metering (id, organization_id, period_month, logs_ingested, ai_analyses, action_executions, token_usage)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, 
        orgId, 
        periodMonth, 
        metric === 'logs_ingested' ? amount : 0,
        metric === 'ai_analyses' ? amount : 0,
        metric === 'action_executions' ? amount : 0,
        metric === 'token_usage' ? amount : 0
      );
    }
  } catch (error) {
    console.error(`Failed to record usage for ${orgId}:`, error);
  }
}
