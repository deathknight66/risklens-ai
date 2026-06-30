import { NextResponse } from 'next/server';
import { stripe, getPlanIdFromPriceId } from '@/lib/billing/stripe';
import db from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!signature || !webhookSecret) {
      throw new Error("Missing stripe-signature or webhook secret");
    }
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Audit Log Webhook
  try {
    db.prepare('INSERT INTO billing_logs (id, organization_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, ?)').run(
      `blog_${crypto.randomBytes(8).toString('hex')}`,
      (event.data.object as any)?.client_reference_id || 'system',
      event.type,
      JSON.stringify(event.data.object),
      now
    );
  } catch (e) {
    console.error("Failed to log webhook event", e);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const organizationId = session.client_reference_id;
        if (!organizationId) break;

        const customerId = session.customer;
        const subscriptionId = session.subscription;

        // Retrieve subscription to get current_period_end and price
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;
        const planId = getPlanIdFromPriceId(priceId);

        db.prepare(`
          INSERT OR REPLACE INTO subscriptions (id, organization_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, cancel_at_period_end)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `sub_${crypto.randomBytes(8).toString('hex')}`,
          organizationId,
          planId,
          customerId,
          subscriptionId,
          subscription.status,
          new Date(subscription.current_period_end * 1000).toISOString(),
          subscription.cancel_at_period_end ? 1 : 0
        );

        db.prepare('UPDATE organizations SET plan = ?, stripe_customer_id = ?, grace_until = NULL WHERE id = ?').run(
          planId, customerId, organizationId
        );
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        const priceId = subscription.items.data[0].price.id;
        const planId = getPlanIdFromPriceId(priceId);

        db.prepare(`
          UPDATE subscriptions 
          SET plan_id = ?, status = ?, current_period_end = ?, cancel_at_period_end = ?
          WHERE stripe_subscription_id = ?
        `).run(
          planId,
          subscription.status,
          new Date(subscription.current_period_end * 1000).toISOString(),
          subscription.cancel_at_period_end ? 1 : 0,
          subscription.id
        );

        // Also update the org's top level plan view
        db.prepare(`
          UPDATE organizations SET plan = ? WHERE stripe_customer_id = ?
        `).run(planId, customerId);

        // Clear grace period if active
        if (subscription.status === 'active') {
          db.prepare('UPDATE organizations SET grace_until = NULL WHERE stripe_customer_id = ?').run(customerId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        
        db.prepare("UPDATE subscriptions SET status = 'canceled' WHERE stripe_subscription_id = ?").run(subscription.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        
        // 7-day grace period
        const gracePeriod = new Date();
        gracePeriod.setDate(gracePeriod.getDate() + 7);
        
        db.prepare('UPDATE organizations SET grace_until = ? WHERE stripe_customer_id = ?').run(gracePeriod.toISOString(), customerId);
        
        // Mark subscription past_due
        if (invoice.subscription) {
          db.prepare("UPDATE subscriptions SET status = 'past_due' WHERE stripe_subscription_id = ?").run(invoice.subscription);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        
        // Create internal invoice record
        const org = db.prepare('SELECT id, plan FROM organizations WHERE stripe_customer_id = ?').get(customerId) as any;
        if (!org) break;

        const invoiceId = `inv_${crypto.randomBytes(8).toString('hex')}`;
        
        // Snapshot the plan at payment time
        const { PLANS } = require('@/lib/billing/plans');
        const planSnapshot = JSON.stringify(PLANS[org.plan] || PLANS.free);
        const usageSnapshot = JSON.stringify({}); // Optionally capture metering snapshot

        const hashInput = `${invoiceId}:${org.id}:${planSnapshot}:${now}`;
        const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

        try {
          db.prepare(`
            INSERT INTO invoices (id, organization_id, stripe_invoice_id, plan_snapshot, usage_snapshot, amount, currency, period_start, period_end, status, hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            invoiceId,
            org.id,
            invoice.id,
            planSnapshot,
            usageSnapshot,
            (invoice.amount_paid / 100).toFixed(2), // store in dollars/major units for DB consistency with our UI
            invoice.currency,
            new Date(invoice.period_start * 1000).toISOString(),
            new Date(invoice.period_end * 1000).toISOString(),
            'paid',
            hash,
            now
          );
        } catch (e) {
          // ignore duplicate invoices
        }

        break;
      }
    }
  } catch (err: any) {
    console.error(`Error processing webhook ${event.type}: ${err.message}`);
    return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
