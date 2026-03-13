import { prisma } from "@/lib/prisma";
import { rankVendorsInCategory, computeGlobalRankings } from "@/lib/scoring";
import type { CriterionScore } from "@/lib/scoring";
import { RankingsHub } from "./rankings-hub";

export default async function RankingsPage() {
  const categories = await prisma.category.findMany({
    include: {
      criteria: { orderBy: { weight: "desc" } },
      vendors: {
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              slug: true,
              tier: true,
              hqLocation: true,
              founded: true,
              scores: { include: { criterion: true } },
            },
          },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  // Compute rankings per category
  const categoryRankingsMap = new Map<string, {
    rankings: ReturnType<typeof rankVendorsInCategory>;
    totalWeight: number;
    color: string | null;
  }>();

  const categoryData: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
    icon: string | null;
    criteria: { id: string; key: string; name: string; weight: number }[];
    rankings: {
      vendorId: string;
      vendorName: string;
      vendorSlug: string;
      tier: string;
      hqLocation: string | null;
      founded: number | null;
      normalizedScore: number;
      rawScore: number;
      rank: number;
      dimensions: { criterionKey: string; criterionName: string; score: number; weight: number }[];
    }[];
  }[] = [];

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
        tier: vc.vendor.tier,
        hqLocation: vc.vendor.hqLocation,
        founded: vc.vendor.founded,
        scores: relevantScores,
      };
    });

    const rankings = rankVendorsInCategory(
      vendorScores,
      cat.id,
      cat.name,
    );
    categoryRankingsMap.set(cat.id, { rankings, totalWeight, color: cat.color });

    categoryData.push({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      color: cat.color,
      icon: cat.icon,
      criteria: cat.criteria.map((c) => ({
        id: c.id,
        key: c.key,
        name: c.name,
        weight: c.weight,
      })),
      rankings: rankings.map((r) => {
        const vendorInfo = vendorScores.find((vs) => vs.vendorId === r.vendorId)!;
        return {
          vendorId: r.vendorId,
          vendorName: r.vendorName,
          vendorSlug: r.vendorSlug,
          tier: vendorInfo.tier,
          hqLocation: vendorInfo.hqLocation,
          founded: vendorInfo.founded,
          normalizedScore: r.normalizedScore,
          rawScore: r.rawScore,
          rank: r.rank,
          dimensions: r.dimensions.map((d) => ({
            criterionKey: d.criterionKey,
            criterionName: d.criterionName,
            score: d.score,
            weight: d.weight,
          })),
        };
      }),
    });
  }

  // Compute global rankings
  const globalRankings = computeGlobalRankings(categoryRankingsMap);

  // Enrich with tier from DB
  const vendorTiers = new Map<string, string>();
  categories.forEach((cat) =>
    cat.vendors.forEach((vc) => vendorTiers.set(vc.vendor.id, vc.vendor.tier))
  );
  const enrichedGlobal = globalRankings.map((r) => ({
    ...r,
    tier: vendorTiers.get(r.vendorId) ?? "emerging",
  }));

  return (
    <RankingsHub
      globalRankings={enrichedGlobal}
      categoryData={categoryData}
    />
  );
}
