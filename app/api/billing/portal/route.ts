import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { BillingProvider } from '@/lib/billing/provider';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeOrg = (session.user as any).activeOrganizationId;
  const role = (session.user as any).role;

  if (role !== 'Org Admin') {
    return NextResponse.json({ error: 'Forbidden. Only Org Admins can manage billing.' }, { status: 403 });
  }

  try {
    const { returnUrl } = await req.json();

    const url = await BillingProvider.createPortalSession(activeOrg, returnUrl);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create portal session' }, { status: 500 });
  }
}
