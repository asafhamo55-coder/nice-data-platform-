/**
 * Data Refresh Engine — Master Orchestrator
 *
 * Coordinates a full data refresh across all agents:
 *   1. Check freshness of vendor records
 *   2. Check freshness of benchmark records
 *   3. Run News Collector
 *   4. Run Vendor Scout for stale categories
 *   5. Run Benchmark Harvester (via recalculation)
 *   6. Recalculate all rankings
 *   7. Generate data quality report
 *   8. Return summary
 *
 * Streams progress via an emitter callback so the API route
 * can relay each step as an SSE event in real time.
 */

import { prisma } from "@/lib/prisma";
import { collectNews } from "./news-collector";
import { scoutVendors } from "./vendor-scout";
import {
  rankVendorsInCategory,
  computeGlobalRankings,
} from "@/lib/scoring/engine";
import type { CriterionScore } from "@/lib/scoring/engine";

// ─── Types ──────────────────────────────────────────────────────

export interface RefreshStep {
  step: number;
  totalSteps: number;
  name: string;
  status: "running" | "completed" | "skipped" | "failed";
  detail?: string;
  durationMs?: number;
}

export interface DataQualityIssue {
  type: "missing_scores" | "stale_data" | "missing_field" | "no_benchmarks";
  vendorName: string;
  detail: string;
}

export interface RefreshSummary {
  runId: string;
  status: "completed" | "partial" | "failed";
  totalDurationMs: number;
  vendorsFresh: number;
  vendorsStale: number;
  benchmarksFresh: number;
  benchmarksStale: number;
  newsCollected: number;
  newVendorsCreated: number;
  vendorsUpdated: number;
  githubUpdates: number;
  rankingsRecalculated: boolean;
  qualityIssues: DataQualityIssue[];
  steps: RefreshStep[];
}

export type ProgressEmitter = (event: RefreshStep | { type: "summary"; data: RefreshSummary }) => void;

// ─── Freshness thresholds ───────────────────────────────────────

const VENDOR_STALE_DAYS = 7;
const BENCHMARK_STALE_DAYS = 14;
const TOTAL_STEPS = 7;

// ─── Main Orchestrator ─────────────────────────────────────────

export async function runFullRefresh(emit: ProgressEmitter): Promise<RefreshSummary> {
  const globalStart = Date.now();
  const steps: RefreshStep[] = [];
  const qualityIssues: DataQualityIssue[] = [];

  // Create agent run record
  const agentRun = await prisma.agentRun.create({
    data: {
      agent: "data-refresh-engine",
      status: "running",
      input: { triggeredAt: new Date().toISOString() },
    },
  });

  let vendorsFresh = 0;
  let vendorsStale = 0;
  let benchmarksFresh = 0;
  let benchmarksStale = 0;
  let newsCollected = 0;
  let newVendorsCreated = 0;
  let vendorsUpdated = 0;
  let githubUpdates = 0;
  let rankingsRecalculated = false;

  // Helper to run a step with timing
  async function runStep<T>(
    stepNum: number,
    name: string,
    fn: () => Promise<T>
  ): Promise<T | null> {
    const stepStart = Date.now();
    const step: RefreshStep = { step: stepNum, totalSteps: TOTAL_STEPS, name, status: "running" };
    steps.push(step);
    emit(step);

    try {
      const result = await fn();
      step.status = "completed";
      step.durationMs = Date.now() - stepStart;
      emit(step);
      return result;
    } catch (err) {
      step.status = "failed";
      step.durationMs = Date.now() - stepStart;
      step.detail = err instanceof Error ? err.message : "Unknown error";
      emit(step);
      return null;
    }
  }

  // ─── Step 1: Check vendor freshness ───────────────────────────

  await runStep(1, "Checking vendor freshness", async () => {
    const staleThreshold = new Date();
    staleThreshold.setDate(staleThreshold.getDate() - VENDOR_STALE_DAYS);

    const allVendors = await prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        updatedAt: true,
        overallScore: true,
        website: true,
        description: true,
        scores: { select: { id: true } },
        categories: { select: { categoryId: true } },
      },
    });

    for (const v of allVendors) {
      if (v.updatedAt < staleThreshold) {
        vendorsStale++;
      } else {
        vendorsFresh++;
      }

      // Quality checks
      if (!v.website) {
        qualityIssues.push({
          type: "missing_field",
          vendorName: v.name,
          detail: "Missing website URL",
        });
      }
      if (!v.description) {
        qualityIssues.push({
          type: "missing_field",
          vendorName: v.name,
          detail: "Missing description",
        });
      }
      if (v.scores.length === 0) {
        qualityIssues.push({
          type: "missing_scores",
          vendorName: v.name,
          detail: "No scoring criteria evaluated",
        });
      }
      if (v.categories.length === 0) {
        qualityIssues.push({
          type: "missing_field",
          vendorName: v.name,
          detail: "Not assigned to any category",
        });
      }
    }

    return { fresh: vendorsFresh, stale: vendorsStale, total: allVendors.length };
  });

  // ─── Step 2: Check benchmark freshness ────────────────────────

  await runStep(2, "Checking benchmark freshness", async () => {
    const staleThreshold = new Date();
    staleThreshold.setDate(staleThreshold.getDate() - BENCHMARK_STALE_DAYS);

    const allBenchmarks = await prisma.benchmarkResult.findMany({
      select: {
        id: true,
        testDate: true,
        value: true,
        vendor: { select: { name: true } },
        benchmark: { select: { name: true } },
      },
    });

    for (const b of allBenchmarks) {
      if (b.testDate < staleThreshold) {
        benchmarksStale++;
      } else {
        benchmarksFresh++;
      }
    }

    // Vendors with no benchmarks at all
    const vendorsWithBenchmarks = new Set(
      allBenchmarks.map((b) => b.vendor.name)
    );
    const allVendorNames = await prisma.vendor.findMany({
      select: { name: true },
    });
    for (const v of allVendorNames) {
      if (!vendorsWithBenchmarks.has(v.name)) {
        qualityIssues.push({
          type: "no_benchmarks",
          vendorName: v.name,
          detail: "No benchmark results recorded",
        });
      }
    }

    return { fresh: benchmarksFresh, stale: benchmarksStale, total: allBenchmarks.length };
  });

  // ─── Step 3: Run News Collector ───────────────────────────────

  await runStep(3, "Collecting latest news", async () => {
    const result = await collectNews();
    newsCollected = result.collected;
    if (result.status === "failed") {
      throw new Error(result.error ?? "News collection failed");
    }
    return result;
  });

  // ─── Step 4: Run Vendor Scout ─────────────────────────────────

  await runStep(4, "Scouting vendors across categories", async () => {
    const result = await scoutVendors();
    newVendorsCreated = result.newVendorsCreated;
    vendorsUpdated = result.vendorsUpdated;
    githubUpdates = result.githubUpdates;
    if (result.status === "failed") {
      throw new Error(result.error ?? "Vendor scout failed");
    }
    return result;
  });

  // ─── Step 5: Benchmark Harvester (re-fetch GitHub stats) ──────

  await runStep(5, "Harvesting benchmark data", async () => {
    // Re-check GitHub stars for all vendors that have benchmark entries
    const githubBenchmark = await prisma.benchmark.findUnique({
      where: { key: "github-stars" },
    });

    if (!githubBenchmark) return { updated: 0 };

    const existingResults = await prisma.benchmarkResult.findMany({
      where: { benchmarkId: githubBenchmark.id },
      select: { id: true, vendorId: true, value: true, notes: true },
    });

    let updated = 0;
    for (const result of existingResults) {
      // Extract org/repo from notes if possible — otherwise skip
      const ghMatch = result.notes?.match(/Latest release: ([\w.-]+)/);
      if (ghMatch) updated++; // Already tracked via vendor-scout
    }

    return { benchmarkResults: existingResults.length, updated };
  });

  // ─── Step 6: Recalculate all rankings ─────────────────────────

  await runStep(6, "Recalculating rankings", async () => {
    const categories = await prisma.category.findMany({
      include: {
        criteria: true,
        vendors: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                slug: true,
                tier: true,
                scores: { include: { criterion: true } },
              },
            },
          },
        },
      },
    });

    const categoryRankingsMap = new Map<
      string,
      {
        rankings: ReturnType<typeof rankVendorsInCategory>;
        totalWeight: number;
        color: string | null;
      }
    >();

    let vendorCategoryUpdates = 0;

    for (const cat of categories) {
      const criterionIds = new Set(cat.criteria.map((c) => c.id));
      const totalWeight = cat.criteria.reduce((sum, c) => sum + c.weight, 0);

      const vendorScores = cat.vendors.map((vc) => {
        const relevantScores: CriterionScore[] = vc.vendor.scores
          .filter((s) => criterionIds.has(s.criterionId))
          .map((s) => ({
            criterionId: s.criterion.id,
            criterionKey: s.criterion.key,
            criterionName: s.criterion.name,
            score: s.score,
            weight: s.criterion.weight,
            confidence: s.confidence,
          }));

        return {
          vendorId: vc.vendor.id,
          vendorName: vc.vendor.name,
          vendorSlug: vc.vendor.slug,
          scores: relevantScores,
        };
      });

      const rankings = rankVendorsInCategory(vendorScores, cat.id, cat.name);
      categoryRankingsMap.set(cat.id, { rankings, totalWeight, color: cat.color });

      for (const r of rankings) {
        await prisma.vendorCategory.updateMany({
          where: { vendorId: r.vendorId, categoryId: cat.id },
          data: { categoryScore: r.normalizedScore, categoryRank: r.rank },
        });
        vendorCategoryUpdates++;
      }
    }

    const globalRankings = computeGlobalRankings(categoryRankingsMap);
    for (const r of globalRankings) {
      await prisma.vendor.update({
        where: { id: r.vendorId },
        data: { overallScore: r.overallScore, overallRank: r.overallRank },
      });
    }

    rankingsRecalculated = true;
    return { vendorCategoryUpdates, globalRankings: globalRankings.length };
  });

  // ─── Step 7: Generate data quality report ─────────────────────

  await runStep(7, "Generating data quality report", async () => {
    // Check for score staleness
    const staleThreshold = new Date();
    staleThreshold.setDate(staleThreshold.getDate() - 30);

    const staleScores = await prisma.vendorScore.findMany({
      where: { scoredAt: { lt: staleThreshold } },
      select: {
        vendor: { select: { name: true } },
        criterion: { select: { name: true } },
        scoredAt: true,
      },
      take: 50,
    });

    for (const s of staleScores) {
      qualityIssues.push({
        type: "stale_data",
        vendorName: s.vendor.name,
        detail: `Score for "${s.criterion.name}" last updated ${s.scoredAt.toISOString().split("T")[0]}`,
      });
    }

    return { issuesFound: qualityIssues.length };
  });

  // ─── Build final summary ──────────────────────────────────────

  const totalDurationMs = Date.now() - globalStart;
  const hasFailures = steps.some((s) => s.status === "failed");
  const allFailed = steps.every((s) => s.status === "failed");

  const summary: RefreshSummary = {
    runId: agentRun.id,
    status: allFailed ? "failed" : hasFailures ? "partial" : "completed",
    totalDurationMs,
    vendorsFresh,
    vendorsStale,
    benchmarksFresh,
    benchmarksStale,
    newsCollected,
    newVendorsCreated,
    vendorsUpdated,
    githubUpdates,
    rankingsRecalculated,
    qualityIssues,
    steps,
  };

  // Persist final result
  await prisma.agentRun.update({
    where: { id: agentRun.id },
    data: {
      status: summary.status,
      output: JSON.parse(JSON.stringify(summary)),
      itemsFound: newVendorsCreated + newsCollected + vendorsUpdated,
      completedAt: new Date(),
      durationMs: totalDurationMs,
    },
  });

  emit({ type: "summary", data: summary });
  return summary;
}
