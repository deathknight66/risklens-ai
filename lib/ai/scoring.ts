export class ScoringEngine {
  
  static calculatePredictiveEscalation(
    severityStr: string,
    recurrenceCount: number,
    mitreTacticsCount: number,
    blastRadiusScore: number // 0 to 100 based on asset criticality or related assets
  ) {
    // 1. Severity Score (0-100)
    let severityScore = 0;
    const sev = severityStr.toLowerCase();
    if (sev === 'critical') severityScore = 100;
    else if (sev === 'high') severityScore = 80;
    else if (sev === 'medium') severityScore = 50;
    else if (sev === 'low') severityScore = 20;

    // 2. Recurrence Score (0-100)
    // Assume 10+ occurrences is max (100)
    let recurrenceScore = Math.min((recurrenceCount / 10) * 100, 100);

    // 3. Mitre Tactics Score (0-100)
    // Assume 5+ tactics is max (100)
    let mitreScore = Math.min((mitreTacticsCount / 5) * 100, 100);

    // 4. Hybrid Formula
    // (90 * 0.40) + (80 * 0.25) + (60 * 0.20) + (70 * 0.15)
    const finalScore = (severityScore * 0.40) + (recurrenceScore * 0.25) + (mitreScore * 0.20) + (blastRadiusScore * 0.15);

    let riskBand = 'low';
    if (finalScore >= 80) riskBand = 'critical';
    else if (finalScore >= 60) riskBand = 'high';
    else if (finalScore >= 40) riskBand = 'medium';

    return {
      escalationScore: Math.round(finalScore),
      riskBand,
      recommendEscalation: finalScore >= 75
    };
  }
}
