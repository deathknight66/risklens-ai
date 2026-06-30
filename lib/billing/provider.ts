import db from '@/lib/db';
import crypto from 'crypto';
import { PLANS } from './plans';
import { stripe, STRIPE_PLANS, getPlanIdFromPriceId } from './stripe';

export class BillingProvider {
  static async createCheckoutSession(organizationId: string, planId: string, successUrl: string, cancelUrl: string) {
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(organizationId) as any;
    if (!org) throw new Error('Organization not found');

    const priceId = (STRIPE_PLANS as any)[planId];
    if (!priceId) throw new Error('Invalid plan selected');

    // Create a new checkout session using Stripe SDK
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: org.stripe_customer_id || undefined,
      customer_email: org.stripe_customer_id ? undefined : org.billing_email,
      client_reference_id: organizationId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          organizationId
        }
      }
    });

    return session.url;
  }

  static async createPortalSession(organizationId: string, returnUrl: string) {
    const org = db.prepare('SELECT stripe_customer_id FROM organizations WHERE id = ?').get(organizationId) as any;
    if (!org || !org.stripe_customer_id) throw new Error('Organization has no active Stripe customer');

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: returnUrl,
    });

    return session.url;
  }
}
