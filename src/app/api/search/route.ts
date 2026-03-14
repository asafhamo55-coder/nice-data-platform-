import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/search?q=...
 * Global search across vendors, products, news, and categories.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ vendors: [], products: [], news: [], categories: [] });
  }

  const pattern = `%${q}%`;

  const [vendors, products, news, categories] = await Promise.all([
    prisma.vendor.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        tier: true,
        overallScore: true,
        categories: {
          where: { isPrimary: true },
          select: { category: { select: { name: true } } },
          take: 1,
        },
      },
      take: 6,
      orderBy: { overallRank: "asc" },
    }),
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        pricingModel: true,
        vendor: { select: { name: true, slug: true } },
      },
      take: 4,
    }),
    prisma.newsItem.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        source: true,
        publishedAt: true,
        newsCategory: true,
      },
      take: 4,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { vendors: true } },
      },
      take: 4,
    }),
  ]);

  return NextResponse.json({
    vendors: vendors.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      tier: v.tier,
      score: v.overallScore,
      category: v.categories[0]?.category.name ?? null,
    })),
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      vendorName: p.vendor.name,
      vendorSlug: p.vendor.slug,
      pricingModel: p.pricingModel,
    })),
    news: news.map((n) => ({
      id: n.id,
      title: n.title,
      source: n.source,
      publishedAt: n.publishedAt,
      category: n.newsCategory,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      vendorCount: c._count.vendors,
    })),
  });
}
