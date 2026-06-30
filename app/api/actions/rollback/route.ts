import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAdapterForAction } from '@/lib/engine/decision';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.activeOrganizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const orgId = session.user.activeOrganizationId;

    if (session.user.role === 'Board Member') {
      return NextResponse.json({ error: 'Unauthorized. Board Members cannot rollback actions.' }, { status: 403 });
    }

    const { actionId } = await req.json();

    if (!actionId) {
      return NextResponse.json({ error: 'Missing action ID' }, { status: 400 });
    }

    const action: any = db.prepare('SELECT * FROM actions WHERE id = ? AND organization_id = ? AND deleted_at IS NULL').get(actionId, orgId);
    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    if (action.status !== 'Executed') {
      return NextResponse.json({ error: 'Action is not in Executed state' }, { status: 400 });
    }

    if (!action.rollback_payload) {
      return NextResponse.json({ error: 'No rollback payload found for this action' }, { status: 400 });
    }

    // Check expiry
    if (action.rollback_expires_at && new Date(action.rollback_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Rollback window has expired' }, { status: 400 });
    }

    const adapter = getAdapterForAction(action.action_type);
    if (!adapter) {
      return NextResponse.json({ error: 'No adapter found for action type' }, { status: 500 });
    }

    // Execute rollback
    const rollbackPayload = JSON.parse(action.rollback_payload);
    const response = await adapter.rollback(action.target, rollbackPayload);

    if (response.success) {
      db.prepare(`
        UPDATE actions SET 
          status = ?, 
          rollback_status = ?, 
          rolled_back_at = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        'Rolled Back',
        'Success',
        new Date().toISOString(),
        new Date().toISOString(),
        actionId
      );

      return NextResponse.json({ success: true, response });
    } else {
      db.prepare('UPDATE actions SET rollback_status = ?, updated_at = ? WHERE id = ?').run('Failed', new Date().toISOString(), actionId);
      return NextResponse.json({ error: 'Rollback failed', details: response.error }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error rolling back action:', error);
    return NextResponse.json({ error: 'Failed to rollback action' }, { status: 500 });
  }
}
