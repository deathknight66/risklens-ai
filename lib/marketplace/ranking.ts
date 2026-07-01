export function calculateWeightedRating(
  reviews: { rating: number; verified_install: number }[]
): number {
  if (reviews.length === 0) return 0;
  
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const review of reviews) {
    const weight = review.verified_install ? 2 : 1;
    totalScore += review.rating * weight;
    totalWeight += weight;
  }
  
  return totalScore / totalWeight;
}

export function calculateMarketplaceScore(
  rating: number, // Should be the output of calculateWeightedRating
  installVelocity: number, // 0 to 100
  benchmarkUplift: number, // 0 to 100
  retentionLift: number, // 0 to 100
  creatorScore: number // 0 to 100
): number {
  // Normalize rating to 0-100 scale (assuming 1-5 rating)
  const normalizedRating = Math.max(0, Math.min(100, (rating / 5) * 100));
  
  // Weights based on MTS (Marketplace Trust Score) formula
  // (Rating × 0.30) + (InstallVelocity × 0.20) + (BenchmarkUplift × 0.25) + (RetentionLift × 0.15) + (CreatorScore × 0.10)
  const score = (normalizedRating * 0.30) +
                (installVelocity * 0.20) +
                (benchmarkUplift * 0.25) +
                (retentionLift * 0.15) +
                (creatorScore * 0.10);
                
  return Math.round(score);
}
