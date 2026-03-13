/**
 * Ranking Calculation Engine
 * Computes weighted scores and rankings for vendors across categories.
 */

export interface CriterionScore {
  criterionKey: string;
  score: number;
  weight: number;
  confidence: number;
}

export interface VendorRanking {
  vendorId: string;
  categoryId: string;
  weightedScore: number;
  rank: number;
  scores: CriterionScore[];
}

/**
 * Calculate weighted score for a set of criterion scores.
 */
export function calculateWeightedScore(scores: CriterionScore[]): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = scores.reduce(
    (sum, s) => sum + s.score * s.weight * s.confidence,
    0
  );

  return weightedSum / totalWeight;
}

/**
 * Rank vendors within a category based on their weighted scores.
 */
export function rankVendors(
  vendorScores: { vendorId: string; scores: CriterionScore[] }[],
  categoryId: string
): VendorRanking[] {
  const rankings = vendorScores
    .map((vs) => ({
      vendorId: vs.vendorId,
      categoryId,
      weightedScore: calculateWeightedScore(vs.scores),
      rank: 0,
      scores: vs.scores,
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore);

  rankings.forEach((r, i) => {
    r.rank = i + 1;
  });

  return rankings;
}

/**
 * Normalize scores to 0-100 range.
 */
export function normalizeScore(
  score: number,
  min: number,
  max: number
): number {
  if (max === min) return 50;
  return ((score - min) / (max - min)) * 100;
}
