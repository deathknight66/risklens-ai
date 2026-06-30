import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { analyzeIncident } from '@/lib/engine/llm';
import { storeIncidentMemory, searchSimilarIncidents } from '@/lib/engine/memory';
import { decideAction } from '@/lib/engine/decision';
import { PolicyEngine } from '@/lib/engine/policy';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { incidentId } = await req.json();

    if (!incidentId) {
      return NextResponse.json({ error: 'Missing incidentId' }, { status: 400 });
    }

    // Fetch the incident
    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(incidentId) as any;
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Fetch alerts
    const alerts = db.prepare(`
      SELECT a.* 
      FROM alerts a
      JOIN incident_alerts ia ON a.id = ia.alert_id
      WHERE ia.incident_id = ?
    `).all(incidentId) as any[];

    // Fetch associated logs (using source_ip from alerts)
    const ips = [...new Set(alerts.map((a) => a.source_ip).filter(Boolean))];
    let logs: any[] = [];
    if (ips.length > 0) {
      const placeholders = ips.map(() => '?').join(',');
      logs = db.prepare(`SELECT * FROM logs WHERE source_ip IN (${placeholders})`).all(...ips);
    }

    // Call analyzeIncident with DLQ try/catch
    let result;
    try {
      result = await analyzeIncident(incident, logs);
    } catch (llmError: any) {
      console.error("LLM Analysis Failed (Dead Letter Queue):", llmError);
      db.prepare(`UPDATE incidents SET status = 'analysis_failed', analyst_notes = ? WHERE id = ?`).run(
        `Automated Analysis Failed: ${llmError.message}`, 
        incidentId
      );
      return NextResponse.json({ success: false, error: 'Analysis failed and was queued for review.', details: llmError.message }, { status: 502 });
    }

    // Update the incidents table with the result
    // Cost approximation for gpt-4o: ~$5 / 1M tokens
    const total_tokens = result._meta?.usage || 0;
    const analysis_cost = total_tokens * (5 / 1000000);

    const timeline_json = result.timelineEvents ? JSON.stringify(result.timelineEvents) : null;
    const mitre_tactics = result.mitreMappings ? JSON.stringify(result.mitreMappings) : null;
    const root_cause_tree = result.rootCauseTree ? JSON.stringify(result.rootCauseTree) : null;

    db.prepare(`
      UPDATE incidents
      SET 
        ai_summary = ?,
        timeline_json = ?,
        mitre_tactics = ?,
        root_cause_tree = ?,
        prompt_version = ?,
        token_usage = ?,
        analysis_cost = ?,
        analysis_confidence = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      result.attackSummary || null,
      timeline_json,
      mitre_tactics,
      root_cause_tree,
      result._meta?.promptVersion || 'v2.0',
      total_tokens,
      analysis_cost,
      result.analysisConfidence || null,
      new Date().toISOString(),
      incidentId
    );

    // Trigger memory storage asynchronously
    storeIncidentMemory(incidentId, result, logs).catch(err => {
      console.error("Failed to store incident memory:", err);
    });

    // Run Decision Engine if confidence is sufficient
    if (result.analysisConfidence >= 0.45) {
      // Fetch similar incidents to calculate recurrence
      const similar = await searchSimilarIncidents(incidentId, result, logs);
      const recurrenceScore = similar.reduce((acc, curr) => acc + (curr.recurrenceScore || 0), 1);
      
      const sourceIps = [...new Set(logs.map((l: any) => l.source_ip).filter(Boolean))];
      const targets = [...new Set(logs.map((l: any) => l.target).filter(Boolean))];

      const decision = await decideAction({
        incidentId,
        severity: incident.severity,
        recurrenceScore,
        blastRadius: 1, // Mock metric
        assetCriticality: 'High', // Mock metric
        mitreMappings: result.mitreMappings || [],
        sourceIps,
        targets
      });

      if (decision.recommendedAction && decision.confidence >= 0.80) {
        // Insert into actions table as Awaiting Approval
        const actionId = `act_${crypto.randomBytes(8).toString('hex')}`;
        
        db.prepare(`
          INSERT INTO actions (
            id, incident_id, action_type, target, status, reason, decision_confidence, 
            simulation_payload, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          actionId,
          incidentId,
          decision.recommendedAction,
          decision.target || 'unknown',
          'Awaiting Approval',
          decision.reason,
          decision.confidence,
          decision.simulationPayload ? JSON.stringify(decision.simulationPayload) : null,
          new Date().toISOString(),
          new Date().toISOString()
        );

        // Run Policy Engine to check for auto-execution
        PolicyEngine.evaluateAndEnforce(incidentId, {
          incidentId,
          severity: incident.severity,
          recurrenceScore,
          blastRadius: 1,
          assetCriticality: 'High',
          mitreMappings: result.mitreMappings || [],
          sourceIps,
          targets
        }, actionId);
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error analyzing incident:', error);
    return NextResponse.json({ error: 'Failed to analyze incident' }, { status: 500 });
  }
}
