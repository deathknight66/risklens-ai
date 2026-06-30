import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PLANS } from '@/lib/billing/plans';

function generateUniqueSlug(baseName: string): string {
  let baseSlug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  
  if (!baseSlug) baseSlug = 'org';

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = db.prepare('SELECT id FROM organizations WHERE slug = ?').get(slug);
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

const STARTER_POLICIES = [
  {
    name: 'Block Repeated SQL Injection Attempts',
    conditions: {
      operator: 'AND',
      rules: [
        { field: 'event_type', operator: 'equals', value: 'WAF_BLOCK' },
        { field: 'mitre_technique', operator: 'equals', value: 'T1190' },
      ],
    },
    actions: [{ type: 'block_ip' }],
  },
  {
    name: 'Block Credential Stuffing',
    conditions: {
      operator: 'AND',
      rules: [
        { field: 'event_type', operator: 'equals', value: 'FAILED_LOGIN' },
        { field: 'severity', operator: 'equals', value: 'HIGH' },
      ],
    },
    actions: [{ type: 'block_ip' }],
  }
];

export async function POST(req: Request) {
  try {
    const { email: rawEmail, password, company } = await req.json();

    if (!rawEmail || !password || !company) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();

    // Hardening B: Signup Idempotency
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const orgId = `org_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    // Begin Transaction (simulated logic flow for SQLite)
    // 1. Create User
    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      userId, email, passwordHash, now
    );

    // 2. Create Organization (Hardening C: Slug Resolver)
    const slug = generateUniqueSlug(company);
    const planId = 'starter'; // Default to starter trial
    db.prepare('INSERT INTO organizations (id, name, slug, plan, status, created_at, billing_email) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      orgId, company.trim(), slug, planId, 'active', now, email
    );

    // 3. Create Membership (Org Admin)
    db.prepare('INSERT INTO memberships (id, user_id, organization_id, role) VALUES (?, ?, ?, ?)').run(
      `mem_${crypto.randomBytes(8).toString('hex')}`, userId, orgId, 'Org Admin'
    );

    // 4. Provision Subscription (14-day trial)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 14);
    db.prepare(`
      INSERT INTO subscriptions (id, organization_id, plan_id, status, current_period_end)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `sub_trial_${crypto.randomBytes(6).toString('hex')}`, orgId, planId, 'trialing', periodEnd.toISOString()
    );

    // 5. Hardening D: Seed Starter Policies
    const insertPolicy = db.prepare(`
      INSERT INTO policies (id, organization_id, name, conditions_json, actions_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const policy of STARTER_POLICIES) {
      insertPolicy.run(
        `pol_${crypto.randomBytes(8).toString('hex')}`,
        orgId,
        policy.name,
        JSON.stringify(policy.conditions),
        JSON.stringify(policy.actions),
        now
      );
    }

    // 6. Hardening A: One-time API Key Generation
    const rawApiKey = `rl_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
    db.prepare(`
      INSERT INTO api_keys (id, organization_id, key_hash, scope, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `key_${crypto.randomBytes(8).toString('hex')}`, orgId, keyHash, 'ingest_only', 'active', userId, now
    );

    // 7. Hardening F: Track Funnel Event
    db.prepare('INSERT INTO auth_logs (id, organization_id, user_id, ip, user_agent, login_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      `log_${crypto.randomBytes(8).toString('hex')}`, orgId, userId, 'signup_api', 'signup_api', now, 'signup_created'
    );

    // Return the ONE-TIME raw API Key. It will never be retrievable again.
    return NextResponse.json({ 
      success: true, 
      message: 'Workspace provisioned',
      apiKey: rawApiKey 
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to provision workspace' }, { status: 500 });
  }
}
