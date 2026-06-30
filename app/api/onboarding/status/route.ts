import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeOrg = (session.user as any).activeOrganizationId;

  try {
    const check = db.prepare('SELECT COUNT(*) as count FROM logs WHERE organization_id = ?').get(activeOrg) as any;
    
    if (check.count > 0) {
      // Hardening F: Track activation event
      const userId = (session.user as any).id;
      const alreadyLogged = db.prepare("SELECT id FROM auth_logs WHERE organization_id = ? AND status = 'onboarding_completed'").get(activeOrg);
      
      if (!alreadyLogged) {
        db.prepare('INSERT INTO auth_logs (id, organization_id, user_id, ip, user_agent, login_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          `log_${crypto.randomBytes(8).toString('hex')}`, activeOrg, userId, 'onboarding_api', 'onboarding_api', new Date().toISOString(), 'onboarding_completed'
        );
      }

      return NextResponse.json({ ready: true });
    }

    return NextResponse.json({ ready: false });
  } catch (error) {
    console.error('Onboarding status error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
