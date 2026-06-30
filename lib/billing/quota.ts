import db from '@/lib/db';
import { getPlan } from './plans';

export async function checkQuota(organizationId: string, metric: 'logsIngested' | 'aiAnalyses' | 'seats', requestedAmount: number = 1): Promise<{ allowed: boolean, reason?: string }> {
  // 1. Get Org and Plan
  const org = db.prepare('SELECT plan, grace_until FROM organizations WHERE id = ?').get(organizationId) as any;
  if (!org) return { allowed: false, reason: 'Organization not found' };

  // Fetch the active subscription for the org
  const sub = db.prepare('SELECT status, current_period_end FROM subscriptions WHERE organization_id = ? ORDER BY current_period_end DESC LIMIT 1').get(organizationId) as any;
  
  if (sub) {
    if (sub.status === 'canceled') {
      return { allowed: false, reason: 'Subscription is canceled. Account is in archive mode.' };
    }
    if (sub.status === 'past_due' && (!org.grace_until || new Date(org.grace_until) < new Date())) {
      return { allowed: false, reason: 'Subscription is past due and grace period expired.' };
    }
  }

  // Hardening D: Grace period enforcement
  if (org.grace_until && new Date(org.grace_until) < new Date()) {
    return { allowed: false, reason: 'Account suspended. Grace period expired. Please update billing.' };
  }

  const plan = getPlan(org.plan);

  // 2. Get current month's usage for logs and analyses
  if (metric === 'logsIngested' || metric === 'aiAnalyses') {
    const periodMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usage = db.prepare('SELECT logs_ingested, ai_analyses FROM usage_metering WHERE organization_id = ? AND period_month = ?').get(organizationId, periodMonth) as any;
    
    const currentUsage = usage ? (metric === 'logsIngested' ? usage.logs_ingested : usage.ai_analyses) : 0;
    const limit = plan.limits[metric];

    if (currentUsage + requestedAmount > limit) {
      if (!plan.overage.enabled) {
        return { allowed: false, reason: `Quota exceeded for ${metric}. Please upgrade your plan.` };
      }
      // If overage is enabled, we could potentially allow it and bill them later.
      // For now, we will allow it if overage is enabled.
    }
  }

  // 3. Get current seats
  if (metric === 'seats') {
    const members = db.prepare('SELECT COUNT(*) as count FROM memberships WHERE organization_id = ?').get(organizationId) as any;
    const invites = db.prepare("SELECT COUNT(*) as count FROM invitations WHERE organization_id = ? AND status = 'pending' AND expires_at > ?").get(organizationId, new Date().toISOString()) as any;
    
    const totalSeats = members.count + invites.count;
    if (totalSeats + requestedAmount > plan.limits.seats) {
      return { allowed: false, reason: `Seat limit reached. You have ${plan.limits.seats} seats available. Please upgrade your plan.` };
    }
  }

  return { allowed: true };
}
