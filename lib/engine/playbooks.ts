import db from '@/lib/db';
import crypto from 'crypto';
import { ResourceLocks } from './locks';
import { executeAction } from './actions/executor'; // We can adapt this for the playbook action node

export interface DagNode {
  id: string;
  type: 'condition' | 'action' | 'delay' | 'approval' | 'notify';
  action?: string;
  expression?: string; // For conditions e.g. "severity == 'Critical'"
  target?: string;
  delayMs?: number;
}

export interface DagEdge {
  from: string;
  to: string;
  when?: boolean; // If branching from a condition
}

export interface PlaybookDAG {
  nodes: DagNode[];
  edges: DagEdge[];
}

export class PlaybookEngine {

  /**
   * Evaluates a simple expression against the incident context.
   */
  static evaluateCondition(expression: string, context: any): boolean {
    try {
      // Simplistic evaluator for MVP (e.g. "severity == 'Critical'")
      if (expression.includes("severity ==") || expression.includes("severity == ")) {
        const targetSev = expression.split("==")[1].trim().replace(/['"]/g, '');
        return context.severity.toLowerCase() === targetSev.toLowerCase();
      }
      if (expression.includes("escalationScore >")) {
        const targetScore = parseInt(expression.split(">")[1].trim());
        return context.escalationScore > targetScore;
      }
      return false; // Default safe fail
    } catch (e) {
      console.error("Failed to evaluate expression:", expression);
      return false;
    }
  }

  /**
   * Reverses execution using LIFO Rollback Stack
   */
  static async rollbackPlaybook(runId: string) {
    db.prepare('UPDATE playbook_runs SET status = ? WHERE id = ?').run('rolling_back', runId);
    
    // Fetch all successful action steps in descending order (LIFO)
    const steps = db.prepare(`
      SELECT * FROM playbook_steps 
      WHERE run_id = ? AND status = 'success' AND action_type = 'action'
      ORDER BY executed_at DESC
    `).all(runId) as any[];

    for (const step of steps) {
       // Mock rollback execution logic using rollback_payload
       console.log(`[PLAYBOOK] Rolling back step ${step.node_id} (Target: ${step.target})`);
       db.prepare('UPDATE playbook_steps SET status = ? WHERE id = ?').run('rolled_back', step.id);
    }
    
    db.prepare('UPDATE playbook_runs SET status = ?, completed_at = ? WHERE id = ?')
      .run('rolled_back', new Date().toISOString(), runId);
  }

  /**
   * Main DAG Executor Queue
   */
  static async execute(playbookId: string, incidentId: string, context: any) {
    const playbook = db.prepare('SELECT * FROM playbooks WHERE id = ?').get(playbookId) as any;
    if (!playbook) return;

    // 1. Idempotency Check
    const executionKey = ResourceLocks.checkIdempotency(playbook.organization_id, playbook.id, incidentId);
    if (!executionKey) {
      console.log(`[PLAYBOOK] Skipped execution (Idempotency Key Exists): ${playbookId} on ${incidentId}`);
      return;
    }

    // 2. Initialize Run
    const runId = `pbr_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date();
    
    let initialStatus = 'running';
    let expiresAt = null;
    if (playbook.execution_mode === 'suggest_only') initialStatus = 'suggested';
    if (playbook.execution_mode === 'approval_required') {
      initialStatus = 'pending_approval';
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    }

    const approvalSnapshot = JSON.stringify({
      context,
      playbook_hash: playbook.playbook_hash,
      dag_json: playbook.dag_json
    });

    db.prepare(`
      INSERT INTO playbook_runs (id, organization_id, playbook_id, incident_id, execution_key, status, approval_snapshot_json, started_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(runId, playbook.organization_id, playbook.id, incidentId, executionKey, initialStatus, approvalSnapshot, now.toISOString(), expiresAt);

    // Beta Telemetry
    const { BetaTelemetry } = require('@/lib/engine/telemetry');
    if (!BetaTelemetry.hasTracked(playbook.organization_id, 'first_playbook_run')) {
      BetaTelemetry.track(playbook.organization_id, 'first_playbook_run', undefined, undefined, { playbookId });
    }

    if (initialStatus !== 'running') {
      console.log(`[PLAYBOOK] Run ${runId} paused with status: ${initialStatus}`);
      return; // Halt execution for suggest_only or approval_required
    }

    await this._runDAG(runId, playbook, context);
  }

  /**
   * Approves a pending playbook run and begins execution
   */
  static async approveRun(runId: string) {
    const run = db.prepare('SELECT * FROM playbook_runs WHERE id = ?').get(runId) as any;
    if (!run || run.status !== 'pending_approval') {
      throw new Error('Run not found or not pending approval');
    }

    if (run.expires_at && new Date(run.expires_at) < new Date()) {
      db.prepare('UPDATE playbook_runs SET status = ? WHERE id = ?').run('expired', runId);
      throw new Error('Playbook approval has expired (24h limit)');
    }

    db.prepare('UPDATE playbook_runs SET status = ? WHERE id = ?').run('running', runId);
    
    const playbook = db.prepare('SELECT * FROM playbooks WHERE id = ?').get(run.playbook_id) as any;
    const snapshot = JSON.parse(run.approval_snapshot_json || '{}');
    const context = snapshot.context || {};

    // Re-verify hash to ensure playbook wasn't maliciously altered post-approval
    if (playbook.playbook_hash && playbook.playbook_hash !== snapshot.playbook_hash) {
      db.prepare('UPDATE playbook_runs SET status = ? WHERE id = ?').run('failed', runId);
      throw new Error('Playbook signature mismatch: The playbook was modified after approval.');
    }

    // Run in background so API can return immediately
    this._runDAG(runId, playbook, context).catch(console.error);
    return true;
  }

  /**
   * Internal DAG Traversal Logic
   */
  private static async _runDAG(runId: string, playbook: any, context: any) {
    const dag: PlaybookDAG = JSON.parse(playbook.dag_json);
    
    // Identify Start Nodes (nodes with no incoming edges)
    const incomingEdges = new Set(dag.edges.map(e => e.to));
    const startNodes = dag.nodes.filter(n => !incomingEdges.has(n.id));

    // Queue for traversal
    let queue: string[] = startNodes.map(n => n.id);
    const completedNodes = new Set<string>();

    let failed = false;

    // 3. Execution Loop
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (completedNodes.has(nodeId)) continue; // DAG Guard

      const node = dag.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      let resultStatus = 'success';
      let rollbackPayload = null;
      let conditionResult: boolean | null = null;

      console.log(`[PLAYBOOK] Executing Node: ${node.id} (${node.type})`);

      try {
        if (node.type === 'action') {
          // Attempt concurrency lock if target is specified
          if (node.target) {
             const locked = ResourceLocks.acquireLock(playbook.organization_id, runId, node.target);
             if (!locked) throw new Error(`Resource lock acquisition failed for target: ${node.target}`);
          }
          // Note: In real app, we await actual REST calls here. 
          rollbackPayload = JSON.stringify({ rollback_action: `reverse_${node.action}` });
          
          if (node.target) ResourceLocks.releaseLock(node.target);
        } else if (node.type === 'condition') {
          conditionResult = this.evaluateCondition(node.expression || '', context);
        } else if (node.type === 'delay') {
          await new Promise(res => setTimeout(res, node.delayMs || 1000));
        }

        // Record Step
        db.prepare(`
          INSERT INTO playbook_steps (id, run_id, node_id, action_type, target, status, execution_log, rollback_payload, executed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `pbs_${crypto.randomBytes(8).toString('hex')}`,
          runId,
          node.id,
          node.type,
          node.target || null,
          'success',
          conditionResult !== null ? `Condition Evaluated: ${conditionResult}` : 'Executed Successfully',
          rollbackPayload,
          new Date().toISOString()
        );

      } catch (e: any) {
        console.error(`[PLAYBOOK] Node ${node.id} failed:`, e);
        failed = true;
        
        db.prepare(`
          INSERT INTO playbook_steps (id, run_id, node_id, action_type, target, status, execution_log, executed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(`pbs_${crypto.randomBytes(8).toString('hex')}`, runId, node.id, node.type, node.target || null, 'failed', e.message, new Date().toISOString());
        break;
      }

      completedNodes.add(node.id);

      // 4. Resolve next edges
      const outgoing = dag.edges.filter(e => e.from === node.id);
      for (const edge of outgoing) {
        if (node.type === 'condition') {
          if (edge.when === conditionResult) queue.push(edge.to);
        } else {
          queue.push(edge.to);
        }
      }
    }

    if (failed) {
      await this.rollbackPlaybook(runId);
    } else {
      db.prepare('UPDATE playbook_runs SET status = ?, completed_at = ? WHERE id = ?')
        .run('completed', new Date().toISOString(), runId);
    }
  }
}
