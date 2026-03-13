import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryDetail } from "./category-detail";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      criteria: { orderBy: { weight: "desc" } },
      benchmarks: {
        include: {
          results: {
            include: { vendor: { select: { id: true, name: true, slug: true } } },
          },
        },
      },
      vendors: {
        include: {
          vendor: {
            include: {
              products: {
                include: {
                  capabilities: { orderBy: { rating: "desc" } },
                },
              },
              scores: {
                include: { criterion: true },
              },
            },
          },
        },
      },
    },
  });

  if (!category) notFound();

  // Build vendor data with scores specific to this category
  const vendors = category.vendors.map((vc) => {
    const v = vc.vendor;
    // Only scores relevant to this category's criteria
    const categoryScores = v.scores.filter((s) =>
      category.criteria.some((c) => c.id === s.criterionId)
    );

    let overallScore = 0;
    if (categoryScores.length > 0) {
      const totalWeight = categoryScores.reduce((sum, s) => sum + s.criterion.weight, 0);
      const weightedSum = categoryScores.reduce(
        (sum, s) => sum + s.score * s.criterion.weight * s.confidence,
        0
      );
      overallScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) : 0;
    }

    // Dimension scores for this category
    const dimensions = categoryScores.map((s) => ({
      key: s.criterion.key,
      name: s.criterion.name,
      score: Math.round(s.score * 10),
      weight: s.criterion.weight,
    }));

    // All capabilities across products
    const capabilities = v.products.flatMap((p) =>
      p.capabilities.map((c) => ({
        key: c.key,
        name: c.name,
        maturity: c.maturity,
        rating: c.rating,
        productName: p.name,
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
      isPrimary: vc.isPrimary,
      overallScore,
      dimensions,
      capabilities,
      productCount: v.products.length,
    };
  });

  // Sort by score descending for leaderboard
  vendors.sort((a, b) => b.overallScore - a.overallScore);

  // Criteria data
  const criteria = category.criteria.map((c) => ({
    id: c.id,
    name: c.name,
    key: c.key,
    weight: c.weight,
    description: c.description,
  }));

  // Benchmark data
  const benchmarks = category.benchmarks.map((b) => ({
    id: b.id,
    name: b.name,
    key: b.key,
    unit: b.unit,
    higherIsBetter: b.higherIsBetter,
    results: b.results.map((r) => ({
      vendorId: r.vendor.id,
      vendorName: r.vendor.name,
      value: r.value,
    })),
  }));

  const categoryData = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    color: category.color,
  };

  return (
    <CategoryDetail
      category={categoryData}
      vendors={vendors}
      criteria={criteria}
      benchmarks={benchmarks}
    />
  );
}
