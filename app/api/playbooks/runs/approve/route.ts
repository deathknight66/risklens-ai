import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PlaybookEngine } from '@/lib/engine/playbooks';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { runId } = await req.json();
    if (!runId) return NextResponse.json({ error: 'Missing runId' }, { status: 400 });

    // The PlaybookEngine method handles loading the DB record, validating status, verifying hash, 
    // and kicking off the background DAG traversal execution.
    await PlaybookEngine.approveRun(runId);

    return NextResponse.json({ success: true, message: 'Playbook run approved and started' });
  } catch (error: any) {
    console.error('Playbook Approval Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve playbook' }, { status: 500 });
  }
}
