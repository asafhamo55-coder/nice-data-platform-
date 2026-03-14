export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { EvaluationsHub } from "./evaluations-hub";

export default async function EvaluationsPage() {
  const [evaluations, categories, vendors] = await Promise.all([
    prisma.evaluation.findMany({
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            tier: true,
            categories: {
              where: { isPrimary: true },
              include: { category: { select: { id: true, name: true, slug: true, color: true } } },
              take: 1,
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      include: {
        criteria: { orderBy: { weight: "desc" } },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        tier: true,
        categories: {
          include: { category: { select: { id: true, name: true, slug: true } } },
        },
        scores: {
          include: { criterion: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const evalData = evaluations.map((e) => {
    const results = e.results as Record<string, unknown> ?? {};
    const criteria = (e.criteria as { key: string; name: string; weight: number }[]) ?? [];
    const scores = (results.scores as Record<string, number>) ?? {};
    const primaryCat = e.vendor.categories[0]?.category ?? null;

    return {
      id: e.id,
      title: e.title,
      vendorId: e.vendorId,
      vendorName: e.vendor.name,
      vendorSlug: e.vendor.slug,
      vendorTier: e.vendor.tier,
      categoryName: (results.categoryId as string) ? null : primaryCat?.name ?? null,
      categoryColor: primaryCat?.color ?? null,
      status: e.status,
      score: e.score,
      summary: e.summary,
      notes: (results.notes as string) ?? "",
      recommendation: (results.recommendation as string) ?? "",
      dimensions: criteria.map((c) => ({
        key: c.key,
        name: c.name,
        weight: c.weight,
        score: scores[c.key] ?? 0,
      })),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  });

  const catData = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    criteria: c.criteria.map((cr) => ({
      id: cr.id,
      key: cr.key,
      name: cr.name,
      weight: cr.weight,
    })),
  }));

  const vendorData = vendors.map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    tier: v.tier,
    categoryIds: v.categories.map((vc) => vc.categoryId),
    // Benchmark scores for comparison
    benchmarkScores: v.scores.map((s) => ({
      criterionKey: s.criterion.key,
      criterionName: s.criterion.name,
      score: Math.round(s.score * 10), // 0-10 → 0-100
    })),
  }));

  return (
    <EvaluationsHub
      evaluations={evalData}
      categories={catData}
      vendors={vendorData}
    />
  );
}
