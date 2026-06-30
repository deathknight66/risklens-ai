import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';
import crypto from 'crypto';
import { onboardingPacks, OnboardingPackId } from '@/lib/onboarding/packs';
import { BetaTelemetry } from '@/lib/engine/telemetry';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const orgId = (session.user as any).activeOrganizationId;
  const userId = (session.user as any).id;

  try {
    const { packId } = await req.json();
    const pack = onboardingPacks[packId as OnboardingPackId];
    if (!pack) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });

    BetaTelemetry.track(orgId, 'pack_selected', userId, undefined, { packId });

    // 1. Generate API Key
    const rawApiKey = `rl_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
    const keyId = `key_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO api_keys (id, organization_id, key_hash, scope, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(keyId, orgId, keyHash, 'ingest_only', 'active', userId, now);

    BetaTelemetry.track(orgId, 'api_key_generated', userId, undefined, { scope: 'ingest_only', context: 'onboarding_pack' });

    // 2. Provision Pack Playbooks
    for (const pb of pack.playbooks) {
      const pbId = `pb_${crypto.randomBytes(8).toString('hex')}`;
      db.prepare(`
        INSERT INTO playbooks (id, organization_id, name, description, dag_json, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(pbId, orgId, pb.name, pb.description, pb.dag_json, now, now);
    }

    // 3. Provision Pack Policies
    for (const pol of pack.policies) {
      const polId = `pol_${crypto.randomBytes(8).toString('hex')}`;
      db.prepare(`
        INSERT INTO policies (id, organization_id, name, conditions_json, actions_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(polId, orgId, pol.name, pol.conditions_json, pol.actions_json, now);
    }

    return NextResponse.json({ 
      success: true,
      apiKey: rawApiKey,
      pack: pack
    });

  } catch (error) {
    console.error('Onboarding Setup Error:', error);
    return NextResponse.json({ error: 'Failed to setup pack' }, { status: 500 });
  }
}
