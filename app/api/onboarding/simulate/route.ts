import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function POST(request: Request) {
  try {
    const { playbookId, orgId, incidents } = await request.json();

    const db = new Database(dbPath);

    // Fetch playbook to base the simulation on
    const playbook = db.prepare('SELECT * FROM marketplace_assets WHERE id = ?').get(playbookId) as any;
    
    // Default mock data if no playbook is passed
    const playbookName = playbook ? playbook.name : 'Autonomous Containment Playbook';
    const incidentName = incidents?.[0] || 'Malicious Payload Detected';

    // Mock Simulation Results
    // In production, this would use a real isolated sandbox execution engine.
    const simulationResult = {
      event: {
        id: `evt_sim_${Date.now()}`,
        type: incidentName,
        severity: 'high',
        detected_at: new Date().toISOString()
      },
      execution_log: [
        { step: 1, action: "Analyze Event Context", status: "success", duration_ms: 120 },
        { step: 2, action: `Map to Playbook: ${playbookName}`, status: "success", duration_ms: 45 },
        { step: 3, action: "Identify Target Entity", status: "success", duration_ms: 80 },
        { step: 4, action: "Execute Containment (Dry Run)", status: "success", duration_ms: 410 },
        { step: 5, action: "Snapshot Pre-Execution State", status: "success", duration_ms: 150 }
      ],
      metrics: {
        simulated_mttr_saved_mins: playbook?.verified ? 65 : 30,
        estimated_cost_avoided_usd: playbook?.verified ? 1500 : 450,
        analyst_time_reclaimed_hrs: playbook?.verified ? 1.5 : 0.5,
        total_duration_ms: 805
      }
    };

    if (orgId) {
       db.prepare('UPDATE organizations SET onboarding_step = ? WHERE id = ?').run('simulation', orgId);
    }

    // Wait a brief moment to simulate processing
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json(simulationResult);

  } catch (error: any) {
    console.error('Simulate POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
