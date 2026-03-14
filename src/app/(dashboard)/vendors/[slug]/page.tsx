export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VendorDetail } from "./vendor-detail";

function deriveVendorType(
  name: string,
  website: string | null
): "commercial" | "open-source" | "open-core" {
  const n = name.toLowerCase();
  const w = (website ?? "").toLowerCase();
  if (n.startsWith("apache ") || n === "mlflow (oss)" || w.includes("apache.org")) {
    return "open-source";
  }
  if (
    ["airbyte", "metabase", "clickhouse", "redpanda", "minio", "datahub", "great expectations", "soda", "prefect", "tyk", "gravitee", "rudderstack"].some(
      (k) => n.toLowerCase().includes(k)
    )
  ) {
    return "open-core";
  }
  return "commercial";
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function VendorDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const vendor = await prisma.vendor.findUnique({
    where: { slug },
    include: {
      categories: {
        include: { category: true },
      },
      products: {
        include: {
          capabilities: {
            orderBy: { rating: "desc" },
          },
        },
      },
      scores: {
        include: { criterion: { include: { category: true } } },
      },
      benchmarks: {
        include: { benchmark: { include: { category: true } } },
      },
      evaluations: {
        orderBy: { updatedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!vendor) notFound();

  // Compute overall score
  let overallScore = 0;
  if (vendor.scores.length > 0) {
    const totalWeight = vendor.scores.reduce((sum, s) => sum + s.criterion.weight, 0);
    const weightedSum = vendor.scores.reduce(
      (sum, s) => sum + s.score * s.criterion.weight * s.confidence,
      0
    );
    overallScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) : 0;
  }

  const type = deriveVendorType(vendor.name, vendor.website);
  const primaryCat =
    vendor.categories.find((vc) => vc.isPrimary)?.category ?? vendor.categories[0]?.category ?? null;

  // Group scores by criterion for dimension bars
  const dimensions = vendor.scores.map((s) => ({
    key: s.criterion.key,
    name: s.criterion.name,
    score: Math.round(s.score * 10), // 0-10 → 0-100
    weight: s.criterion.weight,
    confidence: s.confidence,
    category: s.criterion.category.name,
  }));

  // Products data
  const products = vendor.products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    pricingModel: p.pricingModel,
    pricingUrl: p.pricingUrl,
    tier: p.tier,
    capabilities: p.capabilities.map((c) => ({
      id: c.id,
      name: c.name,
      key: c.key,
      description: c.description,
      maturity: c.maturity,
      rating: c.rating,
    })),
  }));

  // Benchmark data
  const benchmarkResults = vendor.benchmarks.map((br) => ({
    id: br.id,
    value: br.value,
    testDate: br.testDate.toISOString(),
    benchmark: {
      id: br.benchmark.id,
      name: br.benchmark.name,
      key: br.benchmark.key,
      unit: br.benchmark.unit,
      higherIsBetter: br.benchmark.higherIsBetter,
      category: br.benchmark.category.name,
    },
  }));

  // Evaluations
  const evaluations = vendor.evaluations.map((e) => ({
    id: e.id,
    title: e.title,
    status: e.status,
    summary: e.summary,
    score: e.score,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  // Fetch all vendors for comparison dropdown (minimal data)
  const allVendors = await prisma.vendor.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      scores: {
        include: { criterion: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const comparisonVendors = allVendors
    .filter((v) => v.id !== vendor.id)
    .map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      dimensions: v.scores.map((s) => ({
        key: s.criterion.key,
        name: s.criterion.name,
        score: Math.round(s.score * 10),
      })),
    }));

  const categories = vendor.categories.map((vc) => ({
    id: vc.category.id,
    name: vc.category.name,
    slug: vc.category.slug,
    color: vc.category.color,
    isPrimary: vc.isPrimary,
  }));

  const vendorData = {
    id: vendor.id,
    name: vendor.name,
    slug: vendor.slug,
    description: vendor.description,
    website: vendor.website,
    logoUrl: vendor.logoUrl,
    founded: vendor.founded,
    hqLocation: vendor.hqLocation,
    employeeRange: vendor.employeeRange,
    marketCap: vendor.marketCap,
    revenue: vendor.revenue,
    tier: vendor.tier,
    type,
    overallScore,
    primaryCategory: primaryCat
      ? { id: primaryCat.id, name: primaryCat.name, slug: primaryCat.slug, color: primaryCat.color }
      : null,
    categories,
    dimensions,
    products,
    benchmarkResults,
    evaluations,
  };

  return <VendorDetail vendor={vendorData} comparisonVendors={comparisonVendors} />;
}
