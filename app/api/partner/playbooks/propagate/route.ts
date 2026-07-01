import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function POST(req: Request) {
  try {
    const db = new Database(dbPath);
    const body = await req.json();
    const { 
      partnerId, 
      partnerUserId,
      playbookId, 
      targetTenantIds, 
      idempotencyKey, 
      isDryRun 
    } = body;

    if (!partnerId || !partnerUserId || !playbookId || !targetTenantIds || !Array.isArray(targetTenantIds)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    if (!idempotencyKey) {
      return NextResponse.json({ error: 'idempotencyKey is required for this high-blast radius operation.' }, { status: 400 });
    }

    const partner = db.prepare('SELECT * FROM partners WHERE slug = ? OR id = ?').get(partnerId, partnerId) as any;
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const playbook = db.prepare('SELECT * FROM partner_playbooks WHERE id = ? AND partner_id = ?').get(playbookId, partner.id) as any;
    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found or does not belong to partner' }, { status: 404 });
    }

    // 1. Tenant Eligibility Filter
    const eligibleAccounts = db.prepare(`
      SELECT organization_id FROM partner_accounts 
      WHERE partner_id = ? AND status = 'active'
    `).all(partner.id).map((a: any) => a.organization_id);

    const validTargets = targetTenantIds.filter(id => eligibleAccounts.includes(id));
    const invalidTargets = targetTenantIds.filter(id => !eligibleAccounts.includes(id));

    if (validTargets.length === 0) {
      return NextResponse.json({ error: 'No eligible target tenants found.' }, { status: 400 });
    }

    // 2. Check Idempotency
    // We can check if an activity log with this idempotency key exists
    const existingLog = db.prepare(`
      SELECT * FROM partner_activity_logs 
      WHERE partner_id = ? AND metadata_json LIKE ? 
    `).get(partner.id, `%"idempotencyKey":"${idempotencyKey}"%`);

    if (existingLog && !isDryRun) {
      return NextResponse.json({ 
        status: 'idempotent_success', 
        message: 'This operation was already executed successfully.',
        log: existingLog 
      });
    }

    // 3. Execution (or Dry Run)
    const results = [];
    const dbTx = db.transaction(() => {
      for (const orgId of validTargets) {
        // Rollback Snapshot logic: backup existing playbooks with same name (mock)
        const existingPl = db.prepare('SELECT * FROM playbooks WHERE organization_id = ? AND name = ?').get(orgId, playbook.name) as any;
        const rollbackSnapshot = existingPl ? existingPl.dag_json : null;

        if (!isDryRun) {
          // If it exists, update it. If not, insert it.
          const now = new Date().toISOString();
          if (existingPl) {
            db.prepare(`
              UPDATE playbooks SET dag_json = ?, updated_at = ? WHERE id = ?
            `).run(playbook.playbook_json, now, existingPl.id);
          } else {
            db.prepare(`
              INSERT INTO playbooks (id, organization_id, name, description, dag_json, execution_mode, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(crypto.randomBytes(8).toString('hex'), orgId, playbook.name, `Propagated from MSSP Playbook: ${playbook.name}`, playbook.playbook_json, 'fully_autonomous', now, now);
          }

          // Write Audit Trail
          db.prepare(`
            INSERT INTO partner_activity_logs (id, partner_id, partner_user_id, organization_id, action_type, resource_type, resource_id, metadata_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            crypto.randomBytes(8).toString('hex'), 
            partner.id, 
            partnerUserId, 
            orgId, 
            'playbook_propagated', 
            'playbook', 
            playbookId, 
            JSON.stringify({ 
              idempotencyKey, 
              playbook_name: playbook.name,
              rollback_snapshot_available: !!rollbackSnapshot
            }), 
            now
          );
        }

        results.push({
          orgId,
          status: 'success',
          action: existingPl ? 'updated' : 'created',
          rollback_snapshot_available: !!rollbackSnapshot
        });
      }
      
      if (!isDryRun) {
        db.prepare('UPDATE partner_playbooks SET adoption_count = adoption_count + ? WHERE id = ?')
          .run(validTargets.length, playbookId);
      }
    });

    dbTx();

    return NextResponse.json({
      status: isDryRun ? 'dry_run_complete' : 'success',
      playbook: playbook.name,
      successful_deployments: results.length,
      invalid_targets: invalidTargets.length,
      details: results
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
