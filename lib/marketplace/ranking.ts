export function calculateMarketplaceScore(
  rating: number,
  installVelocity: number, // 0 to 100
  benchmarkUplift: number, // 0 to 100
  partnerReputation: number // 0 to 100
): number {
  // Normalize rating to 0-100 scale (assuming 1-5 rating)
  const normalizedRating = Math.max(0, Math.min(100, (rating / 5) * 100));
  
  // Weights based on GTM-10 architecture
  // (Rating × 0.35) + (Install Velocity × 0.25) + (Benchmark Uplift × 0.25) + (Partner Reputation × 0.15)
  const score = (normalizedRating * 0.35) +
                (installVelocity * 0.25) +
                (benchmarkUplift * 0.25) +
                (partnerReputation * 0.15);
                
  return Math.round(score);
}
