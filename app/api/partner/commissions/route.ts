import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId is required' }, { status: 400 });
    }

    const db = new Database(dbPath);

    // Get commissions
    const commissions = db.prepare(`
      SELECT pc.*, o.name as company_name 
      FROM partner_commissions pc
      JOIN organizations o ON pc.organization_id = o.id
      WHERE pc.partner_id = ?
      ORDER BY pc.created_at DESC
    `).all(partnerId);

    // Mock CSV export generation
    const csvRows = [
      ['Invoice ID', 'Company', 'Amount', 'Status', 'Date'],
      ...commissions.map((c: any) => [
        c.invoice_id,
        c.company_name,
        c.commission_amount,
        c.status,
        c.created_at
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');

    return NextResponse.json({
      commissions,
      export_ready: true,
      export_url: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
    });

  } catch (error: any) {
    console.error('Error fetching partner commissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
