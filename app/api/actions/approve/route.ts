import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { executeAction } from '@/lib/engine/actions/executor';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (session?.user?.role === 'Board Member') {
      return NextResponse.json({ error: 'Unauthorized. Board Members cannot execute actions.' }, { status: 403 });
    }

    const { actionId, approvedBy } = await req.json();

    if (!actionId || !approvedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await executeAction(actionId, approvedBy);

    if (result.success) {
      return NextResponse.json({ success: true, response: result.response });
    } else {
      return NextResponse.json({ error: result.error, details: result.details }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error approving action:', error);
    return NextResponse.json({ error: 'Failed to approve and execute action' }, { status: 500 });
  }
}
