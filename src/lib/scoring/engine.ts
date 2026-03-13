/**
 * Ranking Calculation Engine
 * Computes weighted scores and rankings for vendors across categories.
 *
 * Scoring formula per vendor per category:
 *   rawScore = Σ(score × weight × confidence) / Σ(weight)
 *   normalizedScore = (rawScore − minInCategory) / (maxInCategory − minInCategory) × 100
 *
 * Overall score across categories:
 *   Σ(categoryScore × categoryWeight) / Σ(categoryWeight)
 *   where categoryWeight = sum of criterion weights in that category
 */

// ─── Types ──────────────────────────────────────────────────────

export interface CriterionScore {
  criterionId: string;
  criterionKey: string;
  criterionName: string;
  score: number;       // raw 0-10
  weight: number;
  confidence: number;  // 0-1
}

export interface VendorCategoryRanking {
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  categoryId: string;
  categoryName: string;
  rawScore: number;        // weighted average 0-10
  normalizedScore: number; // 0-100 within category
  rank: number;
  dimensions: CriterionScore[];
}

export interface VendorGlobalRanking {
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  tier: string;
  overallScore: number;  // 0-100
  overallRank: number;
  categoryRankings: {
    categoryId: string;
    categoryName: string;
    categoryColor: string | null;
    score: number;
    rank: number;
  }[];
}

export interface WeightOverride {
  criterionKey: string;
  weight: number;
}

// ─── Core scoring ───────────────────────────────────────────────

/**
 * Calculate weighted score for a set of criterion scores.
 * Returns raw score on the 0-10 scale.
 */
export function calculateWeightedScore(
  scores: CriterionScore[],
  weightOverrides?: Map<string, number>
): number {
  if (scores.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const s of scores) {
    const w = weightOverrides?.get(s.criterionKey) ?? s.weight;
    totalWeight += w;
    weightedSum += s.score * w * s.confidence;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Normalize a value to 0-100 given min and max of the range.
 */
export function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.round(Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)));
}

// ─── Category-specific ranking ──────────────────────────────────

/**
 * Rank vendors within a single category.
 * 1. Compute raw weighted score per vendor
 * 2. Normalize across vendors within the category to 0-100
 * 3. Assign ranks
 */
export function rankVendorsInCategory(
  vendorScores: { vendorId: string; vendorName: string; vendorSlug: string; scores: CriterionScore[] }[],
  categoryId: string,
  categoryName: string,
  weightOverrides?: Map<string, number>
): VendorCategoryRanking[] {
  // Step 1: raw scores
  const withRaw = vendorScores.map((vs) => ({
    ...vs,
    rawScore: calculateWeightedScore(vs.scores, weightOverrides),
    dimensions: vs.scores,
  }));

  // Step 2: find min/max for normalization
  const rawScores = withRaw.map((v) => v.rawScore);
  const min = Math.min(...rawScores);
  const max = Math.max(...rawScores);

  // Step 3: normalize and sort
  const rankings: VendorCategoryRanking[] = withRaw
    .map((v) => ({
      vendorId: v.vendorId,
      vendorName: v.vendorName,
      vendorSlug: v.vendorSlug,
      categoryId,
      categoryName,
      rawScore: Math.round(v.rawScore * 100) / 100,
      normalizedScore: normalizeScore(v.rawScore, min, max),
      rank: 0,
      dimensions: v.dimensions,
    }))
    .sort((a, b) => b.normalizedScore - a.normalizedScore || b.rawScore - a.rawScore);

  // Step 4: assign ranks (handle ties)
  for (let i = 0; i < rankings.length; i++) {
    if (i > 0 && rankings[i].normalizedScore === rankings[i - 1].normalizedScore) {
      rankings[i].rank = rankings[i - 1].rank;
    } else {
      rankings[i].rank = i + 1;
    }
  }

  return rankings;
}

// ─── Global ranking ─────────────────────────────────────────────

/**
 * Compute global rankings across all categories.
 * A vendor's overall score = weighted average of their category scores,
 * where category weight = sum of criterion weights in that category.
 */
export function computeGlobalRankings(
  categoryRankings: Map<string, { rankings: VendorCategoryRanking[]; totalWeight: number; color: string | null }>,
): VendorGlobalRanking[] {
  // Collect all unique vendors
  const vendorMap = new Map<string, {
    vendorId: string;
    vendorName: string;
    vendorSlug: string;
    tier: string;
    categories: { categoryId: string; categoryName: string; categoryColor: string | null; score: number; rank: number; catWeight: number }[];
  }>();

  for (const [catId, { rankings, totalWeight, color }] of categoryRankings) {
    for (const r of rankings) {
      if (!vendorMap.has(r.vendorId)) {
        vendorMap.set(r.vendorId, {
          vendorId: r.vendorId,
          vendorName: r.vendorName,
          vendorSlug: r.vendorSlug,
          tier: "",
          categories: [],
        });
      }
      vendorMap.get(r.vendorId)!.categories.push({
        categoryId: catId,
        categoryName: r.categoryName,
        categoryColor: color,
        score: r.normalizedScore,
        rank: r.rank,
        catWeight: totalWeight,
      });
    }
  }

  // Compute overall score per vendor
  const globalList = [...vendorMap.values()].map((v) => {
    const totalCatWeight = v.categories.reduce((sum, c) => sum + c.catWeight, 0);
    const weightedScore = v.categories.reduce(
      (sum, c) => sum + c.score * c.catWeight,
      0
    );
    const overallScore = totalCatWeight > 0 ? Math.round(weightedScore / totalCatWeight) : 0;

    return {
      vendorId: v.vendorId,
      vendorName: v.vendorName,
      vendorSlug: v.vendorSlug,
      tier: v.tier,
      overallScore,
      overallRank: 0,
      categoryRankings: v.categories.map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        categoryColor: c.categoryColor,
        score: c.score,
        rank: c.rank,
      })),
    };
  });

  // Sort and assign global ranks
  globalList.sort((a, b) => b.overallScore - a.overallScore);
  for (let i = 0; i < globalList.length; i++) {
    if (i > 0 && globalList[i].overallScore === globalList[i - 1].overallScore) {
      globalList[i].overallRank = globalList[i - 1].overallRank;
    } else {
      globalList[i].overallRank = i + 1;
    }
  }

  return globalList;
}

// ─── CSV export helper ──────────────────────────────────────────

export function globalRankingsToCsv(rankings: VendorGlobalRanking[]): string {
  const allCategories = new Set<string>();
  rankings.forEach((r) => r.categoryRankings.forEach((c) => allCategories.add(c.categoryName)));
  const catCols = [...allCategories].sort();

  const header = ["Rank", "Vendor", "Overall Score", ...catCols.map((c) => `${c} Score`), ...catCols.map((c) => `${c} Rank`)];
  const rows = rankings.map((r) => {
    const scores = catCols.map((c) => {
      const cat = r.categoryRankings.find((cr) => cr.categoryName === c);
      return cat ? String(cat.score) : "";
    });
    const ranks = catCols.map((c) => {
      const cat = r.categoryRankings.find((cr) => cr.categoryName === c);
      return cat ? String(cat.rank) : "";
    });
    return [String(r.overallRank), r.vendorName, String(r.overallScore), ...scores, ...ranks];
  });

  return [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}

export function categoryRankingsToCsv(
  rankings: VendorCategoryRanking[],
  categoryName: string
): string {
  const allDimensions = new Set<string>();
  rankings.forEach((r) => r.dimensions.forEach((d) => allDimensions.add(d.criterionName)));
  const dimCols = [...allDimensions].sort();

  const header = ["Rank", "Vendor", "Score (Normalized)", "Score (Raw)", ...dimCols];
  const rows = rankings.map((r) => {
    const dims = dimCols.map((d) => {
      const dim = r.dimensions.find((dd) => dd.criterionName === d);
      return dim ? String(Math.round(dim.score * 10)) : "";
    });
    return [String(r.rank), r.vendorName, String(r.normalizedScore), String(r.rawScore), ...dims];
  });

  return [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}
