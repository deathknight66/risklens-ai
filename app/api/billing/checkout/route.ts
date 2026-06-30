import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { BillingProvider } from '@/lib/billing/provider';
import { PLANS } from '@/lib/billing/plans';

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
    const { planId, successUrl, cancelUrl } = await req.json();

    if (!PLANS[planId]) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const url = await BillingProvider.createCheckoutSession(activeOrg, planId, successUrl, cancelUrl);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
