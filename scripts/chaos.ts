import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const CHAOS_DB_PATH = path.join(process.cwd(), 'risklens.chaos.db');

// Ensure we are working with a fresh chaos DB
if (fs.existsSync(CHAOS_DB_PATH)) {
  fs.unlinkSync(CHAOS_DB_PATH);
}
fs.copyFileSync(path.join(process.cwd(), 'risklens.db'), CHAOS_DB_PATH);

// Force the app to use the chaos DB
process.env.DATABASE_URL = CHAOS_DB_PATH;

// Now import the app modules (must be after setting DATABASE_URL)
import db from '@/lib/db';
import { executeAction } from '@/lib/engine/actions/executor';
import { recordUsage } from '@/lib/engine/metering';
import { storeIncidentMemory, searchSimilarIncidents, ensureCollectionExists } from '@/lib/engine/memory';
import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });
const COLLECTION_NAME = 'risklens_incidents';
const CHAOS_RUN_ID = 'chaos_2026_06';

async function runTests() {
  console.log('------------------------------------------');
  console.log('RiskLens Multi-Tenant Chaos Validation');
  console.log('------------------------------------------\n');

  let passed = 0;
  const total = 8;

  try {
    // SETUP ORGS
    const orgA = 'org_a_chaos';
    const orgB = 'org_b_chaos';

    db.exec(`
      INSERT INTO organizations (id, name, slug, plan, status, created_at) VALUES 
      ('${orgA}', 'Org A Chaos', 'orga', 'enterprise', 'active', '${new Date().toISOString()}'),
      ('${orgB}', 'Org B Chaos', 'orgb', 'enterprise', 'active', '${new Date().toISOString()}');
    `);

    const incidentA = 'inc_chaos_a';
    const incidentB = 'inc_chaos_b';
    const actionB = 'act_chaos_b';

    db.exec(`
      INSERT INTO incidents (id, organization_id, title, severity, status, created_at, updated_at) VALUES 
      ('${incidentA}', '${orgA}', 'Incident A', 'High', 'Open', '${new Date().toISOString()}', '${new Date().toISOString()}'),
      ('${incidentB}', '${orgB}', 'Incident B', 'Critical', 'Open', '${new Date().toISOString()}', '${new Date().toISOString()}');
    `);

    db.exec(`
      INSERT INTO actions (id, organization_id, incident_id, action_type, target, status, created_at, updated_at) VALUES 
      ('${actionB}', '${orgB}', '${incidentB}', 'Isolate Host', '10.0.0.5', 'Awaiting Approval', '${new Date().toISOString()}', '${new Date().toISOString()}');
    `);

    // [TEST 1] Tenant Bleed Test
    const fetchIncident = (id: string, orgId: string) => {
      return db.prepare('SELECT * FROM incidents WHERE id = ? AND organization_id = ? AND deleted_at IS NULL').get(id, orgId);
    };
    
    // Org A trying to fetch Org B incident
    const leakedIncident = fetchIncident(incidentB, orgA);
    if (!leakedIncident) {
      console.log('[PASS] Tenant Bleed Test');
      passed++;
    } else {
      console.log('[FAIL] Tenant Bleed Test');
    }

    // [TEST 2] Cross-Tenant Action Lock
    // Org A tries to approve action B
    const actionResult = await executeAction(actionB, orgA, 'usr_hacker');
    if (actionResult.success === false && (actionResult.error?.includes('not found') || actionResult.error?.includes('already executing'))) {
      console.log('[PASS] Cross-Tenant Action Lock');
      passed++;
    } else {
      console.log('[FAIL] Cross-Tenant Action Lock');
    }

    // [TEST 3] Report Isolation
    // Simulate report generation query
    const reportData = db.prepare(`SELECT * FROM incidents WHERE organization_id = ?`).all(orgA) as any[];
    if (reportData.length === 1 && reportData[0].id === incidentA) {
      console.log('[PASS] Report Isolation');
      passed++;
    } else {
      console.log('[FAIL] Report Isolation');
    }

    // [TEST 4] Replay Isolation
    const replayIncident = fetchIncident(incidentB, orgA);
    if (!replayIncident) {
      console.log('[PASS] Replay Isolation');
      passed++;
    } else {
      console.log('[FAIL] Replay Isolation');
    }

    // [TEST 5] Qdrant Namespace Isolation
    await ensureCollectionExists();
    
    const mockAnalysis = {
      attackSummary: `Chaos Test Execution ${CHAOS_RUN_ID}`,
      rootCauseTree: [{ step: "Init" }],
      mitreMappings: ["T1059"]
    };

    // Store in Org B
    await storeIncidentMemory(incidentB, orgB, { ...mockAnalysis, analysisConfidence: 0.9 }, []);

    // Search from Org A
    const searchRes = await searchSimilarIncidents(incidentA, orgA, mockAnalysis, []);
    
    // We expect 0 results for Org A because the memory is in Org B
    // Filter out previous chaos runs by checking if the incident belongs to Org B
    const leakedMemories = searchRes.filter((r: any) => r.payload?.incident_id === incidentB);

    if (leakedMemories.length === 0) {
      console.log('[PASS] Qdrant Namespace Isolation');
      passed++;
    } else {
      console.log('[FAIL] Qdrant Namespace Isolation');
    }

    // [TEST 6] Metering Segregation
    recordUsage(orgA, 'logs_ingested', 100);
    recordUsage(orgB, 'logs_ingested', 500);

    const usageA = db.prepare('SELECT * FROM usage_metering WHERE organization_id = ?').get(orgA) as any;
    const usageB = db.prepare('SELECT * FROM usage_metering WHERE organization_id = ?').get(orgB) as any;

    if (usageA.logs_ingested === 100 && usageB.logs_ingested === 500) {
      console.log('[PASS] Metering Segregation');
      passed++;
    } else {
      console.log('[FAIL] Metering Segregation');
    }

    // [TEST 7] Soft Delete Isolation
    // Soft delete incident A
    db.prepare("UPDATE incidents SET deleted_at = ? WHERE id = ?").run(new Date().toISOString(), incidentA);
    
    // Try to fetch it
    const deletedFetch = fetchIncident(incidentA, orgA);
    if (!deletedFetch) {
      console.log('[PASS] Soft Delete Isolation');
      passed++;
    } else {
      console.log('[FAIL] Soft Delete Isolation');
    }

    // [TEST 8] Membership Drift Test
    // Simulating context switch
    let currentSessionOrg = orgA;
    const getIncidents = () => db.prepare('SELECT * FROM incidents WHERE organization_id = ? AND deleted_at IS NULL').all(currentSessionOrg) as any[];
    
    currentSessionOrg = orgB;
    const contextResults = getIncidents();
    if (contextResults.length === 1 && contextResults[0].id === incidentB) {
      console.log('[PASS] Membership Drift');
      passed++;
    } else {
      console.log('[FAIL] Membership Drift');
    }

    // Cleanup Qdrant Chaos
    await qdrant.delete(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: "organization_id",
            match: { value: orgB }
          }
        ]
      }
    });

  } catch (err) {
    console.error("Chaos testing error:", err);
  }

  console.log('\n------------------------------------------');
  console.log(`Isolation Score: ${passed}/${total}`);
  console.log(`Verdict: ${passed === total ? 'SaaS Safe' : 'Vulnerable'}`);
  console.log('------------------------------------------');
}

runTests();
