import { ActionAdapter, ActionSimulationPayload, ConnectorResponse } from '../types';

export class FirewallAdapter implements ActionAdapter {
  async simulate(target: string, payload?: any): Promise<ActionSimulationPayload> {
    return {
      projectedDowntime: "0 minutes",
      affectedSystems: ["Edge Gateway", "Public API"],
      blastRadius: 1 // Single IP block has low blast radius
    };
  }

  async execute(target: string, payload?: any): Promise<ConnectorResponse> {
    const token = process.env.CLOUDFLARE_API_TOKEN;
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;

    if (token && zoneId) {
      console.log(`[FIREWALL REAL] Executing block IP on ${target} via Cloudflare`);
      try {
        const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/firewall/access_rules/rules`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mode: "block",
            configuration: {
              target: "ip",
              value: target
            },
            notes: "Blocked autonomously by RiskLens AI"
          })
        });

        const data = await res.json();
        
        if (data.success) {
          const ruleId = data.result.id;
          return {
            success: true,
            executionId: `cf-${ruleId}`,
            rollbackable: true,
            logs: [`Blocked IP ${target} on Cloudflare Edge (Rule ID: ${ruleId})`],
            rollbackPayload: { ruleId, ip: target, provider: 'cloudflare' }
          };
        } else {
          return {
            success: false,
            executionId: '',
            rollbackable: false,
            logs: [`Failed to block IP on Cloudflare: ${JSON.stringify(data.errors)}`],
            error: data.errors?.[0]?.message || 'Unknown Cloudflare API Error'
          };
        }
      } catch (err: any) {
        return {
          success: false,
          executionId: '',
          rollbackable: false,
          logs: [`Network error calling Cloudflare API`],
          error: err.message
        };
      }
    }

    // Sandbox Fallback
    console.log(`[FIREWALL SANDBOX] Executing block IP on ${target}`);
    const executionId = `fw-${Math.random().toString(36).substring(7)}`;
    return {
      success: true,
      executionId,
      rollbackable: true,
      logs: [`[SANDBOX] Blocked IP ${target} on edge firewall`, `Propagated to WAF rules`],
      rollbackPayload: { ruleId: executionId, ip: target, provider: 'sandbox' }
    };
  }

  async rollback(target: string, rollbackPayload: any): Promise<ConnectorResponse> {
    const token = process.env.CLOUDFLARE_API_TOKEN;
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;

    if (rollbackPayload?.provider === 'cloudflare' && token && zoneId) {
      console.log(`[FIREWALL REAL] Rolling back rule ${rollbackPayload.ruleId} for IP ${rollbackPayload.ip} via Cloudflare`);
      try {
        const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/firewall/access_rules/rules/${rollbackPayload.ruleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await res.json();
        if (data.success) {
          return {
            success: true,
            executionId: `rollback-${rollbackPayload.ruleId}`,
            rollbackable: false,
            logs: [`Removed Cloudflare firewall block rule for IP ${target}`]
          };
        } else {
          return {
            success: false,
            executionId: '',
            rollbackable: false,
            logs: [`Failed to rollback Cloudflare rule: ${JSON.stringify(data.errors)}`],
            error: data.errors?.[0]?.message || 'Unknown Cloudflare API Error'
          };
        }
      } catch (err: any) {
        return {
          success: false,
          executionId: '',
          rollbackable: false,
          logs: [`Network error calling Cloudflare API for rollback`],
          error: err.message
        };
      }
    }

    // Sandbox Fallback
    console.log(`[FIREWALL SANDBOX] Rolling back rule ${rollbackPayload?.ruleId} for IP ${rollbackPayload?.ip}`);
    return {
      success: true,
      executionId: `rollback-${rollbackPayload?.ruleId}`,
      rollbackable: false,
      logs: [`[SANDBOX] Removed firewall block rule for IP ${target}`]
    };
  }
}
