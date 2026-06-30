import { ActionType, ActionSeverity, ActionSimulationPayload, ActionAdapter } from './actions/types';
import { FirewallAdapter } from './actions/adapters/firewall';
import { IamAdapter } from './actions/adapters/iam';
import { KubernetesAdapter } from './actions/adapters/kubernetes';
import db from '@/lib/db';

export interface DecisionContext {
  incidentId: string;
  severity: string;
  recurrenceScore: number;
  blastRadius: number;
  assetCriticality: string;
  mitreMappings: string[];
  sourceIps: string[];
  targets: string[];
}

export interface ActionDecision {
  recommendedAction: ActionType | null;
  target: string | null;
  actionSeverity: ActionSeverity;
  confidence: number;
  rollbackAvailable: boolean;
  simulationPayload?: ActionSimulationPayload;
  reason: string;
}

export function getAdapterForAction(action: ActionType): ActionAdapter | null {
  switch (action) {
    case 'Block IP':
      return new FirewallAdapter();
    case 'Revoke Credentials':
    case 'Force MFA':
    case 'Disable User':
      return new IamAdapter();
    case 'Quarantine Host':
    case 'Scale Down Service':
    case 'Pause Deployment':
      return new KubernetesAdapter();
    default:
      return null;
  }
}

export async function decideAction(context: DecisionContext): Promise<ActionDecision> {
  let recommendedAction: ActionType | null = null;
  let target: string | null = null;
  let actionSeverity: ActionSeverity = 'Low';
  let confidence = 0.5;
  let reason = "No definitive action determined.";

  const hasRepeated = context.recurrenceScore > 1;
  const isHighSeverity = context.severity.toLowerCase() === 'high' || context.severity.toLowerCase() === 'critical';
  
  // Basic heuristic decision tree
  if (context.mitreMappings.includes("T1110") || context.mitreMappings.includes("T1078")) {
    // Credential Access / Brute Force
    if (hasRepeated) {
      recommendedAction = 'Force MFA';
      actionSeverity = 'Medium';
      confidence = 0.85;
      target = context.targets[0] || 'unknown-user';
      reason = `Repeated credential attacks detected (Recurrence: ${context.recurrenceScore.toFixed(1)}). Forcing MFA.`;
    } else {
      recommendedAction = 'Revoke Credentials';
      actionSeverity = 'High';
      confidence = 0.82;
      target = context.targets[0] || 'unknown-user';
      reason = "Compromised credentials detected. Immediate revocation advised.";
    }
  } else if (context.mitreMappings.includes("T1190") || context.sourceIps.length > 0) {
    // Exploit Public-Facing Application (SQLi, etc.)
    recommendedAction = 'Block IP';
    actionSeverity = 'Low'; // Non-destructive mostly
    confidence = 0.91;
    target = context.sourceIps[0] || 'unknown-ip';
    reason = "Exploit attempt from malicious IP. Blocking IP at edge firewall.";
  } else if (context.assetCriticality === 'High' && isHighSeverity) {
    recommendedAction = 'Scale Down Service';
    actionSeverity = 'Critical';
    confidence = 0.75; // Dangerous action
    target = context.targets[0] || 'unknown-service';
    reason = "Critical asset under severe attack. Scaling down to prevent data exfiltration.";
  }

  // Safety Gate: Confidence must be >= 0.80 and incident severity >= High for autonomous execution recommendations
  // Wait, the user said "Only execute if confidence >= 0.80 & severity >= High. Else recommend only".
  // The decision engine provides the recommendation. The execution gate enforces it.
  
  let simulationPayload: ActionSimulationPayload | undefined = undefined;
  let rollbackAvailable = false;

  // Safety Gate: Idempotency Lock
  if (recommendedAction && target) {
    const existingActive = db.prepare(`
      SELECT id FROM actions 
      WHERE target = ? 
        AND action_type = ? 
        AND (status = 'Executed' OR status = 'Executing' OR status = 'Awaiting Approval')
        AND (rollback_status IS NULL OR rollback_status != 'Success')
    `).get(target, recommendedAction);

    if (existingActive) {
      console.log(`[DECISION ENGINE] Idempotency Lock triggered. Action ${recommendedAction} already active for ${target}.`);
      recommendedAction = null;
      target = null;
      confidence = 0;
      reason = "Mitigation already active for this target.";
    } else {
      const adapter = getAdapterForAction(recommendedAction);
      if (adapter) {
        simulationPayload = await adapter.simulate(target, { type: recommendedAction === 'Force MFA' ? 'force_mfa' : 'revoke' });
        rollbackAvailable = true; // All our mock adapters support rollback
      }
    }
  }

  return {
    recommendedAction,
    target,
    actionSeverity,
    confidence,
    rollbackAvailable,
    simulationPayload,
    reason
  };
}
