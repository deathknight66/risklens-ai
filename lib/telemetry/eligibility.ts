/**
 * Benchmark Eligibility Gate
 * The canonical "truth filter" for all benchmark and marketplace ranking data.
 */

export interface AceEventCheck {
  integrity_score: number;
  simulation_flag: boolean;
  mttr_seconds: number;
  verified: boolean;
}

export function isEligibleForBenchmarks(event: AceEventCheck): boolean {
  return (
    event.integrity_score >= 0.72 &&
    event.simulation_flag === false &&
    event.mttr_seconds > 0 &&
    event.verified === true
  );
}
