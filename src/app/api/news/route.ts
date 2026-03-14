import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const cursor = sp.get("cursor") ?? undefined;
  const take = Math.min(Number(sp.get("take")) || 20, 50);

  const where: Record<string, unknown> = {};

  const newsCategory = sp.get("newsCategory");
  if (newsCategory) where.newsCategory = newsCategory;

  const categoryId = sp.get("categoryId");
  if (categoryId) where.categoryId = categoryId;

  const minRelevance = sp.get("minRelevance");
  if (minRelevance) where.relevance = { gte: Number(minRelevance) };

  const search = sp.get("q");
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { summary: { contains: search, mode: "insensitive" } },
      { tags: { hasSome: [search.toLowerCase()] } },
    ];
  }

  const dateFrom = sp.get("dateFrom");
  const dateTo = sp.get("dateTo");
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    where.publishedAt = dateFilter;
  }

  const items = await prisma.newsItem.findMany({
    where,
    include: {
      vendor: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true, color: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, take) : items;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return NextResponse.json({
    news: page,
    nextCursor,
    hasMore,
  });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, bookmarked } = body as { id: string; bookmarked: boolean };

    if (!id || typeof bookmarked !== "boolean") {
      return NextResponse.json({ error: "id and bookmarked are required" }, { status: 400 });
    }

    const updated = await prisma.newsItem.update({
      where: { id },
      data: { bookmarked },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Failed to update news item:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
