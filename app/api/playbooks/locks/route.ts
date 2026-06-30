import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const activeOrg = (session.user as any).activeOrganizationId;

  try {
    // Clean up expired locks first before returning the active ones
    const now = new Date().toISOString();
    db.prepare('DELETE FROM resource_locks WHERE expires_at < ?').run(now);

    const locks = db.prepare('SELECT * FROM resource_locks WHERE organization_id = ? ORDER BY locked_at DESC').all(activeOrg);
    return NextResponse.json({ locks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch resource locks' }, { status: 500 });
  }
}
