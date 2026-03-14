import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/vendors/compare?ids=id1,id2,id3
 * Returns detailed vendor data for side-by-side comparison.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").filter(Boolean).slice(0, 4);

  if (ids.length < 2) {
    return NextResponse.json(
      { error: "At least 2 vendor IDs required" },
      { status: 400 }
    );
  }

  const vendors = await prisma.vendor.findMany({
    where: { id: { in: ids } },
    include: {
      categories: {
        include: {
          category: { select: { name: true, slug: true } },
        },
      },
      products: {
        select: {
          name: true,
          pricingModel: true,
          pricingUrl: true,
          tier: true,
          capabilities: {
            select: { name: true, maturity: true, rating: true },
          },
        },
      },
      scores: {
        include: {
          criterion: {
            select: { name: true, key: true, weight: true, categoryId: true },
          },
        },
      },
      benchmarks: {
        include: {
          benchmark: { select: { name: true, unit: true, higherIsBetter: true } },
        },
        orderBy: { testDate: "desc" },
      },
    },
  });

  // Build comparison data
  const comparisonData = vendors.map((v) => {
    // Compute weighted score per criterion group
    const scoreMap: Record<string, { score: number; weight: number; confidence: number }> = {};
    for (const s of v.scores) {
      scoreMap[s.criterion.key] = {
        score: s.score,
        weight: s.criterion.weight,
        confidence: s.confidence,
      };
    }

    // Overall weighted score
    const totalWeight = v.scores.reduce((sum, s) => sum + s.criterion.weight, 0);
    const weightedSum = v.scores.reduce(
      (sum, s) => sum + s.score * s.criterion.weight * s.confidence,
      0
    );
    const overallScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) : 0;

    // Radar dimensions: aggregate by criterion name
    const radarDimensions: { name: string; value: number }[] = [];
    const criterionGroups = new Map<string, { sum: number; count: number }>();
    for (const s of v.scores) {
      const existing = criterionGroups.get(s.criterion.name);
      if (existing) {
        existing.sum += s.score;
        existing.count += 1;
      } else {
        criterionGroups.set(s.criterion.name, { sum: s.score, count: 1 });
      }
    }
    for (const [name, { sum, count }] of criterionGroups) {
      radarDimensions.push({ name, value: Math.round((sum / count) * 10) / 10 });
    }

    // All capabilities
    const capabilities = v.products.flatMap((p) =>
      p.capabilities.map((c) => ({
        name: c.name,
        maturity: c.maturity,
        rating: c.rating,
        product: p.name,
      }))
    );

    return {
      id: v.id,
      name: v.name,
      slug: v.slug,
      description: v.description,
      website: v.website,
      tier: v.tier,
      founded: v.founded,
      hqLocation: v.hqLocation,
      employeeRange: v.employeeRange,
      overallScore,
      categories: v.categories.map((vc) => ({
        name: vc.category.name,
        slug: vc.category.slug,
        isPrimary: vc.isPrimary,
        score: vc.categoryScore,
        rank: vc.categoryRank,
      })),
      products: v.products.map((p) => ({
        name: p.name,
        pricingModel: p.pricingModel,
        pricingUrl: p.pricingUrl,
        tier: p.tier,
      })),
      radarDimensions,
      capabilities,
      benchmarks: v.benchmarks.map((b) => ({
        name: b.benchmark.name,
        value: b.value,
        unit: b.benchmark.unit,
        higherIsBetter: b.benchmark.higherIsBetter,
      })),
    };
  });

  return NextResponse.json({ vendors: comparisonData });
}
