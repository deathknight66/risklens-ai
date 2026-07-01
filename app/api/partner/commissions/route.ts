import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function GET(req: Request) {
  try {
    const db = new Database(dbPath);
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partnerId') || 'securita-global';
    
    const partner = db.prepare('SELECT * FROM partners WHERE slug = ? OR id = ?').get(partnerId, partnerId) as any;
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const commissions = db.prepare(`
      SELECT c.*, o.name as org_name
      FROM partner_commissions c
      JOIN organizations o ON c.organization_id = o.id
      WHERE c.partner_id = ?
      ORDER BY c.created_at DESC
    `).all(partner.id) as any[];

    // MVP Simple ARR Calculation
    // In reality, this would query active subscriptions tied to partner_accounts
    const accounts = db.prepare('SELECT * FROM partner_accounts WHERE partner_id = ? AND status = "active"').all(partner.id) as any[];
    const arrUnderManagement = accounts.length * 60000; // Mock $60k ACV per active account

    let pendingTotal = 0;
    let paidTotal = 0;
    let agingUnpaidTotal = 0; // e.g. > 30 days old

    const now = new Date().getTime();

    commissions.forEach(c => {
      if (c.status === 'pending') {
        pendingTotal += c.commission_amount;
        const createdDate = new Date(c.created_at).getTime();
        const daysOld = (now - createdDate) / (1000 * 60 * 60 * 24);
        if (daysOld > 30) {
          agingUnpaidTotal += c.commission_amount;
        }
      } else if (c.status === 'paid') {
        paidTotal += c.commission_amount;
      }
    });

    return NextResponse.json({
      summary: {
        arrUnderManagement,
        pendingTotal,
        paidTotal,
        agingUnpaidTotal
      },
      history: commissions
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
