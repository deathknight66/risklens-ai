/**
 * Integrity Scoring Engine
 * Formula: (Source * 0.3) + (Completeness * 0.25) + (Dedupe * 0.2) + (Execution * 0.25)
 */

export interface IntegrityScoreParams {
  sourceReliability: number; // 0 to 1
  payloadCompleteness: number; // 0 to 1
  deduplicationConfidence: number; // 0 to 1
  
  // Execution Derived Confirmation (Proxy)
  hasContainedAt: boolean;
  rollbackUsed: boolean;
  postActionVerification: boolean;
}

export function calculateIntegrityScore(params: IntegrityScoreParams): number {
  const sourceScore = params.sourceReliability * 0.30;
  const completenessScore = params.payloadCompleteness * 0.25;
  const dedupeScore = params.deduplicationConfidence * 0.20;
  
  // Derived confirmation
  let execBase = 0.0;
  if (params.hasContainedAt) execBase += 0.15;
  if (!params.rollbackUsed) execBase += 0.05;
  if (params.postActionVerification) execBase += 0.05;
  
  const executionScore = execBase; // Max 0.25

  return sourceScore + completenessScore + dedupeScore + executionScore;
}

export function classifyIntegrity(score: number): 'Verified' | 'Probable' | 'Untrusted' {
  if (score >= 0.85) return 'Verified';
  if (score >= 0.70) return 'Probable';
  return 'Untrusted';
}
