export type ActionType = 'Block IP' | 'Revoke Credentials' | 'Disable User' | 'Rotate API Key' | 'Quarantine Host' | 'Scale Down Service' | 'Pause Deployment' | 'Force MFA';

export type ActionSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type ActionStatus = 'AI Suggested' | 'Awaiting Approval' | 'Approved' | 'Executing' | 'Executed' | 'Rolled Back';

export interface ActionSimulationPayload {
  projectedDowntime: string;
  affectedSystems: string[];
  blastRadius: number;
}

export interface ConnectorResponse {
  success: boolean;
  executionId: string;
  rollbackable: boolean;
  logs: string[];
  rollbackPayload?: any; // Information needed to reverse this specific action
  error?: string;
}

export interface ActionAdapter {
  simulate(target: string, payload?: any): Promise<ActionSimulationPayload>;
  execute(target: string, payload?: any): Promise<ConnectorResponse>;
  rollback(target: string, rollbackPayload: any): Promise<ConnectorResponse>;
}
