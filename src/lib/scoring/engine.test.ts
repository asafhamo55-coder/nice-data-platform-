import { describe, it, expect } from "vitest";
import {
  calculateWeightedScore,
  normalizeScore,
  rankVendorsInCategory,
  computeGlobalRankings,
  globalRankingsToCsv,
  categoryRankingsToCsv,
  type CriterionScore,
} from "./engine";

// ─── Test data factories ─────────────────────────────────────────

function makeScore(overrides: Partial<CriterionScore> = {}): CriterionScore {
  return {
    criterionId: "c1",
    criterionKey: "perf",
    criterionName: "Performance",
    score: 8,
    weight: 1,
    confidence: 1,
    ...overrides,
  };
}

function makeVendorScores(
  id: string,
  name: string,
  scores: CriterionScore[]
) {
  return {
    vendorId: id,
    vendorName: name,
    vendorSlug: name.toLowerCase().replace(/\s/g, "-"),
    scores,
  };
}

// ─── calculateWeightedScore ──────────────────────────────────────

describe("calculateWeightedScore", () => {
  it("returns 0 for empty scores", () => {
    expect(calculateWeightedScore([])).toBe(0);
  });

  it("returns the score when single score with weight=1 and confidence=1", () => {
    const scores = [makeScore({ score: 7, weight: 1, confidence: 1 })];
    expect(calculateWeightedScore(scores)).toBe(7);
  });

  it("calculates weighted average correctly", () => {
    const scores = [
      makeScore({ criterionKey: "a", score: 10, weight: 2, confidence: 1 }),
      makeScore({ criterionKey: "b", score: 5, weight: 3, confidence: 1 }),
    ];
    // (10*2*1 + 5*3*1) / (2+3) = (20+15)/5 = 7
    expect(calculateWeightedScore(scores)).toBe(7);
  });

  it("factors in confidence correctly", () => {
    const scores = [
      makeScore({ criterionKey: "a", score: 10, weight: 1, confidence: 0.5 }),
      makeScore({ criterionKey: "b", score: 6, weight: 1, confidence: 1 }),
    ];
    // (10*1*0.5 + 6*1*1) / (1+1) = (5+6)/2 = 5.5
    expect(calculateWeightedScore(scores)).toBe(5.5);
  });

  it("applies weight overrides", () => {
    const scores = [
      makeScore({ criterionKey: "a", score: 10, weight: 1, confidence: 1 }),
      makeScore({ criterionKey: "b", score: 5, weight: 1, confidence: 1 }),
    ];
    const overrides = new Map([["a", 3]]); // override 'a' weight from 1 to 3
    // (10*3*1 + 5*1*1) / (3+1) = 35/4 = 8.75
    expect(calculateWeightedScore(scores, overrides)).toBe(8.75);
  });

  it("handles all-zero weights gracefully", () => {
    const scores = [
      makeScore({ score: 10, weight: 0, confidence: 1 }),
    ];
    expect(calculateWeightedScore(scores)).toBe(0);
  });
});

// ─── normalizeScore ──────────────────────────────────────────────

describe("normalizeScore", () => {
  it("returns 50 when min equals max", () => {
    expect(normalizeScore(5, 5, 5)).toBe(50);
  });

  it("normalizes to 0 for minimum value", () => {
    expect(normalizeScore(2, 2, 10)).toBe(0);
  });

  it("normalizes to 100 for maximum value", () => {
    expect(normalizeScore(10, 2, 10)).toBe(100);
  });

  it("normalizes midpoint correctly", () => {
    expect(normalizeScore(6, 2, 10)).toBe(50);
  });

  it("clamps below 0", () => {
    expect(normalizeScore(0, 2, 10)).toBe(0);
  });

  it("clamps above 100", () => {
    expect(normalizeScore(15, 2, 10)).toBe(100);
  });
});

// ─── rankVendorsInCategory ──────────────────────────────────────

describe("rankVendorsInCategory", () => {
  it("ranks a single vendor at rank 1 with score 50", () => {
    const vendors = [
      makeVendorScores("v1", "Vendor A", [makeScore({ score: 8 })]),
    ];
    const result = rankVendorsInCategory(vendors, "cat1", "Category 1");
    expect(result).toHaveLength(1);
    expect(result[0].rank).toBe(1);
    // single vendor → min === max → normalizedScore = 50
    expect(result[0].normalizedScore).toBe(50);
    expect(result[0].rawScore).toBe(8);
  });

  it("ranks multiple vendors by normalized score descending", () => {
    const vendors = [
      makeVendorScores("v1", "Low", [makeScore({ score: 3 })]),
      makeVendorScores("v2", "High", [makeScore({ score: 9 })]),
      makeVendorScores("v3", "Mid", [makeScore({ score: 6 })]),
    ];
    const result = rankVendorsInCategory(vendors, "cat1", "Category 1");
    expect(result[0].vendorName).toBe("High");
    expect(result[0].rank).toBe(1);
    expect(result[0].normalizedScore).toBe(100);
    expect(result[1].vendorName).toBe("Mid");
    expect(result[1].rank).toBe(2);
    expect(result[1].normalizedScore).toBe(50);
    expect(result[2].vendorName).toBe("Low");
    expect(result[2].rank).toBe(3);
    expect(result[2].normalizedScore).toBe(0);
  });

  it("handles ties correctly (same rank)", () => {
    const vendors = [
      makeVendorScores("v1", "A", [makeScore({ score: 7 })]),
      makeVendorScores("v2", "B", [makeScore({ score: 7 })]),
      makeVendorScores("v3", "C", [makeScore({ score: 5 })]),
    ];
    const result = rankVendorsInCategory(vendors, "cat1", "Cat");
    // A and B tie → both rank 1
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(1);
    expect(result[2].rank).toBe(3);
  });

  it("preserves dimensions on each ranking", () => {
    const dims = [
      makeScore({ criterionKey: "a", score: 8 }),
      makeScore({ criterionKey: "b", score: 6 }),
    ];
    const vendors = [makeVendorScores("v1", "V", dims)];
    const result = rankVendorsInCategory(vendors, "cat1", "Cat");
    expect(result[0].dimensions).toHaveLength(2);
    expect(result[0].dimensions[0].criterionKey).toBe("a");
  });

  it("applies weight overrides during ranking", () => {
    const vendors = [
      makeVendorScores("v1", "A", [
        makeScore({ criterionKey: "x", score: 10, weight: 1, confidence: 1 }),
        makeScore({ criterionKey: "y", score: 2, weight: 1, confidence: 1 }),
      ]),
      makeVendorScores("v2", "B", [
        makeScore({ criterionKey: "x", score: 5, weight: 1, confidence: 1 }),
        makeScore({ criterionKey: "y", score: 9, weight: 1, confidence: 1 }),
      ]),
    ];
    // Without overrides: A=(10+2)/2=6, B=(5+9)/2=7 → B wins
    const noOverride = rankVendorsInCategory(vendors, "c", "C");
    expect(noOverride[0].vendorName).toBe("B");

    // Override: weight x=10, so A=(10*10+2*1)/11=9.27 vs B=(5*10+9*1)/11=5.36 → A wins
    const overrides = new Map([["x", 10]]);
    const withOverride = rankVendorsInCategory(vendors, "c", "C", overrides);
    expect(withOverride[0].vendorName).toBe("A");
  });
});

// ─── computeGlobalRankings ──────────────────────────────────────

describe("computeGlobalRankings", () => {
  it("computes global rankings across categories", () => {
    const cat1Rankings = rankVendorsInCategory(
      [
        makeVendorScores("v1", "Alpha", [makeScore({ score: 9 })]),
        makeVendorScores("v2", "Beta", [makeScore({ score: 5 })]),
      ],
      "cat1",
      "Storage"
    );
    const cat2Rankings = rankVendorsInCategory(
      [
        makeVendorScores("v1", "Alpha", [makeScore({ score: 6 })]),
        makeVendorScores("v2", "Beta", [makeScore({ score: 8 })]),
      ],
      "cat2",
      "Compute"
    );

    const catMap = new Map([
      ["cat1", { rankings: cat1Rankings, totalWeight: 1, color: "#ff0000" }],
      ["cat2", { rankings: cat2Rankings, totalWeight: 1, color: "#00ff00" }],
    ]);

    const global = computeGlobalRankings(catMap);
    expect(global).toHaveLength(2);
    // Both vendors appear in both categories
    expect(global[0].categoryRankings.length).toBeGreaterThanOrEqual(1);
    expect(global[1].categoryRankings.length).toBeGreaterThanOrEqual(1);
    // Ranks are assigned
    expect(global[0].overallRank).toBe(1);
    // Second rank could be 1 (tie) or 2
    expect(global[1].overallRank).toBeGreaterThanOrEqual(1);
  });

  it("handles ties in global ranking", () => {
    const catRankings = rankVendorsInCategory(
      [
        makeVendorScores("v1", "A", [makeScore({ score: 7 })]),
        makeVendorScores("v2", "B", [makeScore({ score: 7 })]),
      ],
      "cat1",
      "Cat"
    );

    const catMap = new Map([
      ["cat1", { rankings: catRankings, totalWeight: 1, color: null }],
    ]);

    const global = computeGlobalRankings(catMap);
    expect(global[0].overallRank).toBe(1);
    expect(global[1].overallRank).toBe(1);
  });

  it("weights categories by totalWeight", () => {
    // cat1 has weight 10, cat2 has weight 1
    // Vendor A: cat1=100, cat2=0 → (100*10+0*1)/11 ≈ 91
    // Vendor B: cat1=0, cat2=100 → (0*10+100*1)/11 ≈ 9
    const cat1 = rankVendorsInCategory(
      [
        makeVendorScores("v1", "A", [makeScore({ score: 10 })]),
        makeVendorScores("v2", "B", [makeScore({ score: 1 })]),
      ],
      "cat1",
      "Heavy"
    );
    const cat2 = rankVendorsInCategory(
      [
        makeVendorScores("v1", "A", [makeScore({ score: 1 })]),
        makeVendorScores("v2", "B", [makeScore({ score: 10 })]),
      ],
      "cat2",
      "Light"
    );

    const catMap = new Map([
      ["cat1", { rankings: cat1, totalWeight: 10, color: null }],
      ["cat2", { rankings: cat2, totalWeight: 1, color: null }],
    ]);

    const global = computeGlobalRankings(catMap);
    expect(global[0].vendorName).toBe("A");
    expect(global[0].overallScore).toBeGreaterThan(global[1].overallScore);
  });
});

// ─── CSV export ─────────────────────────────────────────────────

describe("globalRankingsToCsv", () => {
  it("generates valid CSV with headers and rows", () => {
    const rankings = [
      {
        vendorId: "v1",
        vendorName: "Alpha",
        vendorSlug: "alpha",
        tier: "leader",
        overallScore: 85,
        overallRank: 1,
        categoryRankings: [
          { categoryId: "c1", categoryName: "Storage", categoryColor: null, score: 90, rank: 1 },
        ],
      },
    ];

    const csv = globalRankingsToCsv(rankings);
    const lines = csv.split("\n");
    expect(lines.length).toBe(2); // header + 1 row
    expect(lines[0]).toContain("Rank");
    expect(lines[0]).toContain("Vendor");
    expect(lines[0]).toContain("Overall Score");
    expect(lines[0]).toContain("Storage Score");
    expect(lines[0]).toContain("Storage Rank");
    expect(lines[1]).toContain("Alpha");
    expect(lines[1]).toContain("85");
  });
});

describe("categoryRankingsToCsv", () => {
  it("generates valid CSV for category rankings", () => {
    const rankings = [
      {
        vendorId: "v1",
        vendorName: "Alpha",
        vendorSlug: "alpha",
        categoryId: "c1",
        categoryName: "Storage",
        rawScore: 8.5,
        normalizedScore: 85,
        rank: 1,
        dimensions: [makeScore({ criterionName: "Speed", score: 9 })],
      },
    ];

    const csv = categoryRankingsToCsv(rankings, "Storage");
    const lines = csv.split("\n");
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain("Rank");
    expect(lines[0]).toContain("Score (Normalized)");
    expect(lines[0]).toContain("Speed");
    expect(lines[1]).toContain("Alpha");
  });
});
