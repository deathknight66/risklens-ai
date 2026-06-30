import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const activeOrg = (session.user as any).activeOrganizationId;

  try {
    const logs = db.prepare(`
      SELECT dl.*, d.name as destination_name, d.type as destination_type 
      FROM delivery_logs dl
      JOIN destinations d ON dl.destination_id = d.id
      WHERE dl.organization_id = ? 
      ORDER BY dl.created_at DESC 
      LIMIT 100
    `).all(activeOrg);
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch delivery logs' }, { status: 500 });
  }
}
