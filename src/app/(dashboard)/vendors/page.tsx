import { prisma } from "@/lib/prisma";
import { VendorHub } from "./vendor-hub";

// Derive vendor type from name/website patterns
function deriveVendorType(
  name: string,
  website: string | null
): "commercial" | "open-source" | "open-core" {
  const n = name.toLowerCase();
  const w = (website ?? "").toLowerCase();
  if (
    n.startsWith("apache ") ||
    n === "mlflow (oss)" ||
    w.includes("apache.org")
  ) {
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

export default async function VendorsPage() {
  const [vendors, categories] = await Promise.all([
    prisma.vendor.findMany({
      include: {
        categories: {
          include: { category: true },
        },
        products: {
          select: { id: true, pricingModel: true },
        },
        scores: {
          include: { criterion: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  // Transform to serializable shape with computed overall score
  const vendorData = vendors.map((v) => {
    // Weighted average score → normalize to 0-100
    let overallScore = 0;
    if (v.scores.length > 0) {
      const totalWeight = v.scores.reduce(
        (sum, s) => sum + s.criterion.weight,
        0
      );
      const weightedSum = v.scores.reduce(
        (sum, s) => sum + s.score * s.criterion.weight * s.confidence,
        0
      );
      overallScore =
        totalWeight > 0
          ? Math.round((weightedSum / totalWeight) * 10) // scores are 0-10, scale to 0-100
          : 0;
    }

    const primaryCat = v.categories.find((vc) => vc.isPrimary)?.category ??
      v.categories[0]?.category ?? null;

    const type = deriveVendorType(v.name, v.website);

    const pricingModel =
      v.products[0]?.pricingModel ?? (type === "open-source" ? "free" : "enterprise");

    return {
      id: v.id,
      name: v.name,
      slug: v.slug,
      description: v.description,
      website: v.website,
      logoUrl: v.logoUrl,
      tier: v.tier,
      type,
      founded: v.founded,
      hqLocation: v.hqLocation,
      employeeRange: v.employeeRange,
      overallScore,
      pricingModel,
      primaryCategory: primaryCat
        ? { id: primaryCat.id, name: primaryCat.name, slug: primaryCat.slug, color: primaryCat.color }
        : null,
      categoryCount: v.categories.length,
      productCount: v.products.length,
    };
  });

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    color: c.color,
  }));

  return <VendorHub vendors={vendorData} categories={categoryOptions} />;
}
