import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { BetaTelemetry, BetaEventType } from '@/lib/engine/telemetry';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const orgId = (session.user as any).activeOrganizationId;
  const userId = (session.user as any).id;

  try {
    const { eventType, sessionId, metadata } = await req.json();
    
    if (!eventType) {
      return NextResponse.json({ error: 'Missing eventType' }, { status: 400 });
    }

    // Optional safe-guard for certain first_time events
    if (eventType.startsWith('first_') && BetaTelemetry.hasTracked(orgId, eventType as BetaEventType)) {
      return NextResponse.json({ success: true, message: 'Already tracked' });
    }

    BetaTelemetry.track(orgId, eventType as BetaEventType, userId, sessionId, metadata);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telemetry Error:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
