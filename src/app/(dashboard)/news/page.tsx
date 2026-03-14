export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NewsHub } from "./news-hub";

export default async function NewsPage() {
  const [newsItems, categories] = await Promise.all([
    prisma.newsItem.findMany({
      include: {
        vendor: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, color: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const items = newsItems.map((n) => ({
    id: n.id,
    title: n.title,
    summary: n.summary,
    url: n.url,
    source: n.source,
    sourceIcon: n.sourceIcon,
    imageUrl: n.imageUrl,
    newsCategory: n.newsCategory,
    sentiment: n.sentiment,
    relevance: n.relevance,
    bookmarked: n.bookmarked,
    publishedAt: n.publishedAt.toISOString(),
    tags: n.tags,
    vendorId: n.vendorId,
    vendorName: n.vendor?.name ?? null,
    vendorSlug: n.vendor?.slug ?? null,
    categoryId: n.categoryId,
    categoryName: n.category?.name ?? null,
    categoryColor: n.category?.color ?? null,
  }));

  return (
    <NewsHub
      initialItems={items}
      categories={categories}
    />
  );
}
