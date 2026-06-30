import db from '@/lib/db';
import { DecisionContext } from './decision';
import { executeAction } from './actions/executor';

export class PolicyEngine {
  static evaluateConditionNode(node: any, context: DecisionContext): boolean {
    if (!node) return false;

    // AND array
    if (node.AND && Array.isArray(node.AND)) {
      return node.AND.every((child: any) => this.evaluateConditionNode(child, context));
    }

    // OR array
    if (node.OR && Array.isArray(node.OR)) {
      return node.OR.some((child: any) => this.evaluateConditionNode(child, context));
    }

    // Leaf conditions
    for (const key of Object.keys(node)) {
      const val = node[key];
      
      switch (key) {
        case 'severity':
          if (context.severity.toLowerCase() !== val.toLowerCase()) return false;
          break;
        case 'recurrence_score':
          if (val.startsWith('>')) {
            if (context.recurrenceScore <= parseFloat(val.substring(1))) return false;
          } else if (val.startsWith('<')) {
            if (context.recurrenceScore >= parseFloat(val.substring(1))) return false;
          } else {
            if (context.recurrenceScore !== parseFloat(val)) return false;
          }
          break;
        case 'asset_criticality':
          // Just simple strict match for now
          if (context.assetCriticality.toLowerCase() !== val.toLowerCase()) return false;
          break;
        case 'mitre_technique':
          if (!context.mitreMappings.includes(val)) return false;
          break;
        case 'brute_force_count':
          // Heuristic map to recurrenceScore + T1110
          if (!context.mitreMappings.includes("T1110")) return false;
          if (val.startsWith('>')) {
            if (context.recurrenceScore <= parseFloat(val.substring(1))) return false;
          }
          break;
      }
    }

    return true;
  }

  static async evaluateAndEnforce(incidentId: string, context: DecisionContext, recommendedActionId: string) {
    const policies = db.prepare('SELECT * FROM policies WHERE is_active = 1').all() as any[];

    for (const policy of policies) {
      try {
        const conditions = JSON.parse(policy.conditions_json);
        
        // Evaluate the root node of the policy tree
        const matches = this.evaluateConditionNode(conditions, context);

          if (matches) {
          // Check cooldown
          if (policy.last_triggered_at) {
            const lastTriggered = new Date(policy.last_triggered_at).getTime();
            const now = new Date().getTime();
            const cooldownMs = policy.cooldown_minutes * 60 * 1000;
            if (now - lastTriggered < cooldownMs) {
              console.log(`[POLICY ENGINE] Policy ${policy.name} matched but is in cooldown.`);
              continue; // Skip execution
            }
          }

          // Anti-Loop Breaker: Max 5 actions per target per day from this policy
          const policySignature = `PolicyEngine (Rule: ${policy.name})`;
          
          let loopBreakerTriggered = false;
          for (const target of context.targets) {
            const executedCount = db.prepare(`
              SELECT COUNT(*) as count 
              FROM actions 
              WHERE target = ? 
              AND approved_by = ? 
              AND created_at >= datetime('now', '-1 day')
            `).get(target, policySignature) as any;

            if (executedCount && executedCount.count >= 5) {
              console.log(`[POLICY ENGINE] LOOP BREAKER TRIPPED for target ${target} on policy ${policy.name}. Skipping.`);
              loopBreakerTriggered = true;
              break;
            }
          }

          if (loopBreakerTriggered) {
             continue; // Skip policy to prevent infinite loops
          }

          console.log(`[POLICY ENGINE] Policy ${policy.name} matched! Enforcing autonomous action.`);

          // Update policy last_triggered_at
          db.prepare('UPDATE policies SET last_triggered_at = ? WHERE id = ?').run(new Date().toISOString(), policy.id);

          // Trigger execution automatically
          // We pass "PolicyEngine" as the approvedBy identity
          executeAction(recommendedActionId, `PolicyEngine (Rule: ${policy.name})`).catch(err => {
            console.error(`[POLICY ENGINE] Failed to execute action ${recommendedActionId}:`, err);
          });
          
          // Handle Dispatch Outbound integrations (Phase 5.0) and Playbooks (Phase 5.2)
          const policyActions = JSON.parse(policy.actions_json);
          for (const action of policyActions) {
            if (action.type === 'notify_destination' && action.target) {
              const { DispatchEngine } = require('@/lib/dispatch');
              const orgId = policy.organization_id;
              // Fetch incident details to send
              const incident = db.prepare('SELECT id, title, severity, summary FROM incidents WHERE id = ?').get(incidentId) as any;
              
              if (incident) {
                const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/investigation?id=${incident.id}`;
                DispatchEngine.send(action.target, {
                  incidentId: incident.id,
                  title: incident.title,
                  severity: incident.severity,
                  summary: incident.summary || 'No summary generated yet.',
                  url
                }).catch((e: any) => console.error("Dispatch Error:", e));
              }
            } else if (action.type === 'execute_playbook' && action.playbook_id) {
               // 5.2 Autonomous Playbooks integration
               const { PlaybookEngine } = require('@/lib/engine/playbooks');
               // Execute asynchronously
               PlaybookEngine.execute(action.playbook_id, incidentId, context).catch((e: any) => {
                 console.error(`[POLICY ENGINE] Playbook execution failed:`, e);
               });
            }
          }

          // Stop evaluating further policies to prevent conflicting actions
          break;
        }
      } catch (err) {
        console.error(`[POLICY ENGINE] Error evaluating policy ${policy.id}:`, err);
      }
    }
  }
}
