import { NextResponse } from 'next/server';
import { BillingProvider } from '@/lib/billing/provider';

// This is the actual webhook endpoint that Stripe will hit in production.
export async function POST(req: Request) {
  try {
    const signature = req.headers.get('stripe-signature');
    const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';
    
    // In production, body must be raw. For this POC, we just read text.
    const bodyText = await req.text();

    // Hardening F: Webhook signature verification
    BillingProvider.verifySignature(bodyText, signature || '', secret);

    const event = JSON.parse(bodyText);

    switch (event.type) {
      case 'checkout.session.completed':
      case 'invoice.paid':
      case 'invoice.payment_failed':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // For POC, we just log it because the mock provider currently calls simulateWebhook directly.
        // In production, we would extract the payload and pass it to the handler logic here.
        console.log(`[Stripe Webhook Handler] Received event: ${event.type}`);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }
}
