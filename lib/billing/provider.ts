import db from '@/lib/db';
import crypto from 'crypto';
import { PLANS } from './plans';

// Mock Stripe Provider
export class BillingProvider {
  static async createCheckoutSession(organizationId: string, planId: string, successUrl: string, cancelUrl: string) {
    // In production, this calls stripe.checkout.sessions.create()
    const sessionToken = crypto.randomBytes(16).toString('hex');
    
    // Simulate webhook arrival immediately for local testing
    setTimeout(() => {
      this.simulateWebhook('checkout.session.completed', {
        organizationId,
        planId,
        stripeCustomerId: `cus_${crypto.randomBytes(6).toString('hex')}`,
        stripeSubscriptionId: `sub_${crypto.randomBytes(6).toString('hex')}`
      });
    }, 2000);

    return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/billing/mock-checkout?session=${sessionToken}&success=${encodeURIComponent(successUrl)}`;
  }

  static async cancelSubscription(subscriptionId: string) {
    // In production: stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
    db.prepare('UPDATE subscriptions SET cancel_at_period_end = 1 WHERE stripe_subscription_id = ?').run(subscriptionId);
    return true;
  }

  static simulateWebhook(eventType: string, payload: any) {
    console.log(`[Stripe Mock] Webhook received: ${eventType}`);
    const now = new Date().toISOString();

    db.prepare('INSERT INTO billing_logs (id, organization_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, ?)').run(
      `blog_${crypto.randomBytes(8).toString('hex')}`,
      payload.organizationId || 'unknown',
      eventType,
      JSON.stringify(payload),
      now
    );

    if (eventType === 'checkout.session.completed') {
      const plan = PLANS[payload.planId];
      if (!plan) return;

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      db.prepare(`
        INSERT OR REPLACE INTO subscriptions (id, organization_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, cancel_at_period_end)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `sub_internal_${crypto.randomBytes(6).toString('hex')}`,
        payload.organizationId,
        payload.planId,
        payload.stripeCustomerId,
        payload.stripeSubscriptionId,
        'active',
        periodEnd.toISOString(),
        0
      );

      db.prepare('UPDATE organizations SET plan = ?, stripe_customer_id = ? WHERE id = ?').run(
        payload.planId, payload.stripeCustomerId, payload.organizationId
      );

      // Generate Invoice Snapshot
      const invoiceId = `inv_${crypto.randomBytes(8).toString('hex')}`;
      const planSnapshot = JSON.stringify(plan);
      const usageSnapshot = JSON.stringify({ logs: 0, analyses: 0 }); // Since it's a new sub
      
      const hashInput = `${invoiceId}:${payload.organizationId}:${planSnapshot}:${now}`;
      const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

      db.prepare(`
        INSERT INTO invoices (id, organization_id, stripe_invoice_id, plan_snapshot, usage_snapshot, amount, currency, period_start, period_end, status, hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceId,
        payload.organizationId,
        `in_${crypto.randomBytes(8).toString('hex')}`,
        planSnapshot,
        usageSnapshot,
        plan.pricePerMonth,
        'usd',
        now,
        periodEnd.toISOString(),
        'paid',
        hash,
        now
      );
    }
    
    if (eventType === 'invoice.payment_failed') {
      const gracePeriod = new Date();
      gracePeriod.setDate(gracePeriod.getDate() + 7);
      
      db.prepare('UPDATE organizations SET grace_until = ? WHERE id = ?').run(gracePeriod.toISOString(), payload.organizationId);
      db.prepare("UPDATE subscriptions SET status = 'past_due' WHERE stripe_subscription_id = ?").run(payload.stripeSubscriptionId);
    }
  }

  static verifySignature(body: string, signature: string, secret: string) {
    // Real implementation would use stripe.webhooks.constructEvent()
    // Mock always returns true unless configured otherwise
    if (!signature) throw new Error("Missing stripe-signature header");
    return true; 
  }
}
