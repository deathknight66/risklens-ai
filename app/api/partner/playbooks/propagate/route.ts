import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partnerId, playbookId, targetTenantIds } = body;

    if (!partnerId || !playbookId || !targetTenantIds || !Array.isArray(targetTenantIds)) {
      return NextResponse.json({ error: 'partnerId, playbookId, and targetTenantIds array are required' }, { status: 400 });
    }

    const db = new Database(dbPath);

    // Validate partner and playbook
    const playbook = db.prepare(`SELECT * FROM partner_playbooks WHERE id = ? AND partner_id = ?`).get(playbookId, partnerId) as any;
    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found or does not belong to partner' }, { status: 404 });
    }

    // In a real implementation, we would check partner middleware/RBAC here.
    // Also we would insert the playbook into the tenant's playbooks table.
    
    // For this mock API, we'll increment the adoption_count on the partner_playbooks table to simulate deployment.
    db.prepare(`UPDATE partner_playbooks SET adoption_count = adoption_count + ? WHERE id = ?`).run(targetTenantIds.length, playbookId);

    return NextResponse.json({
      success: true,
      message: `Successfully propagated ${playbook.name} to ${targetTenantIds.length} tenants.`,
      propagated_to: targetTenantIds
    });

  } catch (error: any) {
    console.error('Error propagating playbook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
