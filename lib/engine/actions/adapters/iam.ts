import { ActionAdapter, ActionSimulationPayload, ConnectorResponse } from '../types';

export class IamAdapter implements ActionAdapter {
  async simulate(target: string, payload?: any): Promise<ActionSimulationPayload> {
    // target = username or email
    const isRevoke = payload?.type === 'revoke';
    return {
      projectedDowntime: isRevoke ? "Until manual reset" : "0 minutes (forced re-login)",
      affectedSystems: ["Okta SSO", "VPN Access", "Internal Apps"],
      blastRadius: 2
    };
  }

  async execute(target: string, payload?: any): Promise<ConnectorResponse> {
    // Sandbox: Fake Okta / Microsoft Entra ID
    const executionId = `iam-${Math.random().toString(36).substring(7)}`;
    const actionDesc = payload?.type === 'force_mfa' ? 'Forced MFA' : 'Revoked credentials';
    console.log(`[IAM SANDBOX] Executing ${actionDesc} for user ${target}`);
    
    return {
      success: true,
      executionId,
      rollbackable: true,
      logs: [`${actionDesc} for ${target}`, `Terminated active sessions`],
      rollbackPayload: { userId: target, previousState: 'active', action: payload?.type }
    };
  }

  async rollback(target: string, rollbackPayload: any): Promise<ConnectorResponse> {
    console.log(`[IAM SANDBOX] Rolling back IAM action for ${target}`);
    return {
      success: true,
      executionId: `rollback-${Math.random().toString(36).substring(7)}`,
      rollbackable: false,
      logs: [`Restored user ${target} to active state`, `Cleared forced MFA flags`]
    };
  }
}
