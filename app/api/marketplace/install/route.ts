import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function POST(request: Request) {
  try {
    const { assetId, orgId, userId } = await request.json();

    if (!assetId || !orgId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const db = new Database(dbPath);

    // Verify Asset
    const asset = db.prepare(`SELECT * FROM marketplace_assets WHERE id = ? AND status = 'published'`).get(assetId) as any;
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found or not available' }, { status: 404 });
    }

    // Check for duplicate installation
    const existing = db.prepare(`SELECT * FROM marketplace_installs WHERE asset_id = ? AND organization_id = ?`).get(assetId, orgId);
    if (existing) {
      return NextResponse.json({ error: 'Asset is already installed' }, { status: 400 });
    }

    const now = new Date().toISOString();

    db.transaction(() => {
      // 1. Create the simulated install record
      db.prepare(`
        INSERT INTO marketplace_installs (id, asset_id, organization_id, installed_by, install_mode, license_type, success_state, installed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(crypto.randomBytes(8).toString('hex'), assetId, orgId, userId, 'simulated', 'one_time', 'success', now);

      // 2. Create the payout if the asset has a price
      if (asset.price > 0) {
        db.prepare(`
          INSERT INTO marketplace_payouts (id, creator_partner_id, asset_id, invoice_id, amount, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(crypto.randomBytes(8).toString('hex'), asset.creator_partner_id, asset.id, 'INV-SIMULATED', asset.price, 'pending', now);
      }

      // 3. Increment asset install count
      db.prepare(`UPDATE marketplace_assets SET installs = installs + 1 WHERE id = ?`).run(assetId);

      // 4. Emit audit log
      db.prepare(`
        INSERT INTO auth_logs (id, organization_id, user_id, ip, user_agent, login_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(crypto.randomBytes(8).toString('hex'), orgId, userId, '127.0.0.1', 'RiskLens App', now, `marketplace_install_${assetId}`);
    })();

    return NextResponse.json({ success: true, message: 'Asset installed successfully' });

  } catch (error: any) {
    console.error('Marketplace Install error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
