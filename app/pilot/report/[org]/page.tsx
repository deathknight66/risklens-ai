import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { verifyPilotToken } from '@/lib/hmac';
import crypto from 'crypto';
import ReportClient from './ReportClient';

export default function PilotReportPage({ params, searchParams }: { params: { org: string }, searchParams: { sig?: string } }) {
  const { org } = params;
  const sig = searchParams.sig;

  if (!sig || !verifyPilotToken(sig, org)) {
    return <div className="p-12 text-center text-rose-500 bg-black min-h-screen">Invalid or expired secure link.</div>;
  }

  const organization = db.prepare('SELECT name FROM organizations WHERE id = ?').get(org) as any;
  if (!organization) return notFound();

  // Handle Immutability: check if a snapshot exists
  let snapshot = db.prepare('SELECT * FROM report_snapshots WHERE organization_id = ? ORDER BY generated_at DESC LIMIT 1').get(org) as any;
  let metricsData: any = null;

  if (snapshot) {
    metricsData = JSON.parse(snapshot.snapshot_json);
  } else {
    // Generate new snapshot
    const liveMetrics = db.prepare('SELECT * FROM pilot_success_metrics WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1').get(org) as any;
    if (!liveMetrics) {
      return <div className="p-12 text-center text-slate-400 bg-black min-h-screen">No pilot metrics available to generate report.</div>;
    }

    metricsData = liveMetrics;
    const snapshotJson = JSON.stringify(liveMetrics);
    const hash = crypto.createHash('sha256').update(snapshotJson).digest('hex');

    db.prepare(`
      INSERT INTO report_snapshots (id, organization_id, snapshot_json, hash, generated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomBytes(8).toString('hex'), org, snapshotJson, hash, new Date().toISOString());
  }

  return <ReportClient orgName={organization.name} metrics={metricsData} />;
}
