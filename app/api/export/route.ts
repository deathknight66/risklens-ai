import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

function toCSV(data: any[]) {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + (row[header] ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeOrg = (session.user as any).activeOrganizationId;
  const role = (session.user as any).role;

  if (role !== 'Org Admin' && role !== 'Board Member') {
    return NextResponse.json({ error: 'Forbidden. Export requires higher privileges.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'json';
  const target = searchParams.get('target');

  if (!['json', 'csv'].includes(format)) {
    return NextResponse.json({ error: 'Invalid format. Supported: json, csv' }, { status: 400 });
  }

  const validTargets = ['incidents', 'actions', 'auth_logs', 'usage_metering', 'invoices', 'reports'];
  if (!target || !validTargets.includes(target)) {
    return NextResponse.json({ error: `Invalid target. Supported: ${validTargets.join(', ')}` }, { status: 400 });
  }

  try {
    // Only fetch data scoped to the active organization
    let data = [];
    
    switch (target) {
      case 'incidents':
        data = db.prepare('SELECT id, title, severity, status, created_at, ai_summary FROM incidents WHERE organization_id = ?').all(activeOrg);
        break;
      case 'actions':
        data = db.prepare('SELECT id, incident_id, action_type, target, status, executed_at FROM actions WHERE organization_id = ?').all(activeOrg);
        break;
      case 'auth_logs':
        data = db.prepare('SELECT id, user_id, ip, user_agent, login_at, status FROM auth_logs WHERE organization_id = ?').all(activeOrg);
        break;
      case 'usage_metering':
        data = db.prepare('SELECT period_month, logs_ingested, ai_analyses, action_executions, token_usage FROM usage_metering WHERE organization_id = ?').all(activeOrg);
        break;
      case 'invoices':
        data = db.prepare('SELECT id, amount, currency, period_start, period_end, status, created_at FROM invoices WHERE organization_id = ?').all(activeOrg);
        break;
      case 'reports':
        data = db.prepare('SELECT id, report_period, generated_at, risk_rating, integrity_hash FROM reports WHERE organization_id = ?').all(activeOrg);
        break;
    }

    if (format === 'csv') {
      const csv = toCSV(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="risklens_export_${target}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="risklens_export_${target}_${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}
