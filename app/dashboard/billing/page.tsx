import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";
import { PLANS } from "@/lib/billing/plans";
import BillingClient from "./BillingClient";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const orgId = (session.user as any).activeOrganizationId;

  // 1. Fetch Organization Data
  const org = db.prepare('SELECT plan, grace_until FROM organizations WHERE id = ?').get(orgId) as any;
  if (!org) return <div>Organization not found</div>;

  const plan = PLANS[org.plan] || PLANS.free;

  // 2. Fetch Usage for current month
  const periodMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  let usage = db.prepare('SELECT logs_ingested, ai_analyses FROM usage_metering WHERE organization_id = ? AND period_month = ?').get(orgId, periodMonth) as any;
  if (!usage) usage = { logs_ingested: 0, ai_analyses: 0 };

  // 3. Fetch Seats
  const membersCount = (db.prepare('SELECT COUNT(*) as count FROM memberships WHERE organization_id = ?').get(orgId) as any).count;
  const invitesCount = (db.prepare("SELECT COUNT(*) as count FROM invitations WHERE organization_id = ? AND status = 'pending' AND expires_at > ?").get(orgId, new Date().toISOString()) as any).count;
  const totalSeats = membersCount + invitesCount;

  // 4. Fetch Invoices
  const invoices = db.prepare(`
    SELECT id, amount, currency, status, period_start, period_end, created_at 
    FROM invoices 
    WHERE organization_id = ? 
    ORDER BY created_at DESC
  `).all(orgId);

  // 5. Build usage stats
  const stats = {
    logs: {
      used: usage.logs_ingested,
      limit: plan.limits.logsIngested,
      percent: Math.min(100, Math.round((usage.logs_ingested / plan.limits.logsIngested) * 100))
    },
    analyses: {
      used: usage.ai_analyses,
      limit: plan.limits.aiAnalyses,
      percent: Math.min(100, Math.round((usage.ai_analyses / plan.limits.aiAnalyses) * 100))
    },
    seats: {
      used: totalSeats,
      limit: plan.limits.seats,
      percent: Math.min(100, Math.round((totalSeats / plan.limits.seats) * 100))
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Billing & Usage</h1>
        <p className="text-slate-400 mt-1">Manage your subscription, view usage, and download invoices.</p>
      </div>

      {org.grace_until && new Date(org.grace_until) < new Date() && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400">
          <strong>Account Suspended:</strong> Your grace period has expired. Please upgrade or update your payment method to restore access.
        </div>
      )}

      {org.grace_until && new Date(org.grace_until) >= new Date() && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-400">
          <strong>Payment Failed:</strong> Your last invoice failed. You are in a grace period until {new Date(org.grace_until).toLocaleDateString()}.
        </div>
      )}

      <BillingClient currentPlanId={org.plan} stats={stats} invoices={invoices} plans={PLANS} />
    </div>
  );
}
