export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PricingHub } from "./pricing-hub";

export default async function PricingPage() {
  const [vendors, categories] = await Promise.all([
    prisma.vendor.findMany({
      include: {
        products: { select: { id: true, pricingModel: true }, take: 1 },
        categories: {
          where: { isPrimary: true },
          include: { category: { select: { id: true, name: true, slug: true, color: true } } },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  // Derive vendor type
  function deriveType(name: string, website: string | null): string {
    const n = name.toLowerCase();
    const w = (website ?? "").toLowerCase();
    if (n.startsWith("apache ") || n === "mlflow (oss)" || w.includes("apache.org")) return "open-source";
    if (["airbyte", "metabase", "clickhouse", "redpanda", "minio", "datahub", "great expectations", "soda", "prefect", "tyk", "gravitee", "rudderstack"].some(k => n.includes(k))) return "open-core";
    return "commercial";
  }

  const vendorData = vendors.map((v) => {
    const type = deriveType(v.name, v.website);
    const pricingModel = v.products[0]?.pricingModel ?? (type === "open-source" ? "free" : "enterprise");
    const primaryCat = v.categories[0]?.category ?? null;

    return {
      vendorId: v.id,
      vendorName: v.name,
      vendorSlug: v.slug,
      tier: v.tier,
      pricingModel,
      category: primaryCat?.name ?? "Uncategorized",
      categoryId: primaryCat?.id ?? "",
      categoryColor: primaryCat?.color ?? null,
    };
  });

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  return <PricingHub vendors={vendorData} categories={categoryOptions} />;
}
