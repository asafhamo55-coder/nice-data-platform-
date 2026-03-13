import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rankVendorsInCategory, computeGlobalRankings } from "@/lib/scoring";
import type { CriterionScore } from "@/lib/scoring";

/**
 * POST /api/rankings/recalculate
 * Recalculates all vendor scores and ranks:
 * - Updates VendorCategory.categoryScore and categoryRank per category
 * - Updates Vendor.overallScore and overallRank globally
 */
export async function POST() {
  try {
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
      orderBy: { sortOrder: "asc" },
    });

    const categoryRankingsMap = new Map<string, {
      rankings: ReturnType<typeof rankVendorsInCategory>;
      totalWeight: number;
      color: string | null;
    }>();

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

      // Update VendorCategory records
      for (const r of rankings) {
        await prisma.vendorCategory.updateMany({
          where: { vendorId: r.vendorId, categoryId: cat.id },
          data: { categoryScore: r.normalizedScore, categoryRank: r.rank },
        });
        vendorCategoryUpdates++;
      }
    }

    // Compute and persist global rankings
    const globalRankings = computeGlobalRankings(categoryRankingsMap);

    for (const r of globalRankings) {
      await prisma.vendor.update({
        where: { id: r.vendorId },
        data: { overallScore: r.overallScore, overallRank: r.overallRank },
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      categoriesProcessed: categories.length,
      vendorsRanked: globalRankings.length,
      vendorCategoryUpdates,
      topVendors: globalRankings.slice(0, 10).map((r) => ({
        name: r.vendorName,
        score: r.overallScore,
        rank: r.overallRank,
      })),
    });
  } catch (error) {
    console.error("Ranking recalculation failed:", error);
    return NextResponse.json(
      { success: false, error: "Recalculation failed" },
      { status: 500 }
    );
  }
}
