export interface NormalizedLog {
  id: string;
  timestamp: string;
  sourceIP: string | null;
  target: string | null;
  eventType: string;
  status: string;
  payload: string;
  sourceType: string;
  rawLog: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  ruleName: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  technique: string;
  confidence: number;
  sourceIP?: string | null;
  target?: string | null;
  description: string;
  relatedLogs: NormalizedLog[];
}

export interface Incident {
  id: string;
  createdAt: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Investigating' | 'Resolved';
  sourceIP?: string | null;
  target?: string | null;
  alerts: Alert[];
  aiSummary?: string;
  timelineJson?: string;
  mitreTactics?: string;
  rootCauseTree?: string;
  promptVersion?: string;
  tokenUsage?: number;
  analysisCost?: number;
  analysisConfidence?: number;
  analystNotes?: string;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
}
