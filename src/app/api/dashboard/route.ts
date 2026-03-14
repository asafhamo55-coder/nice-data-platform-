import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard
 * Returns all data needed for the dashboard home page in a single call.
 */
export async function GET() {
  try {
    const [
      vendorCount,
      categories,
      recentNews,
      agentRuns,
      benchmarkCount,
      evaluationCount,
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.category.findMany({
        include: {
          vendors: {
            include: {
              vendor: {
                select: {
                  name: true,
                  slug: true,
                  overallScore: true,
                  updatedAt: true,
                },
              },
            },
            orderBy: { categoryScore: "desc" },
            take: 1,
          },
          _count: { select: { vendors: true } },
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.newsItem.findMany({
        select: {
          id: true,
          title: true,
          summary: true,
          source: true,
          newsCategory: true,
          sentiment: true,
          relevance: true,
          publishedAt: true,
          url: true,
          tags: true,
          vendor: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: 10,
      }),
      prisma.agentRun.findMany({
        select: {
          id: true,
          agent: true,
          status: true,
          itemsFound: true,
          startedAt: true,
          completedAt: true,
          durationMs: true,
          error: true,
        },
        orderBy: { startedAt: "desc" },
        take: 8,
      }),
      prisma.benchmarkResult.count(),
      prisma.evaluation.count(),
    ]);

    // Score count
    const scoreCount = await prisma.vendorScore.count();

    // Category freshness: check oldest vendor update per category
    const now = new Date();
    const FRESH_DAYS = 7;
    const AGING_DAYS = 14;

    const categoryData = categories.map((cat) => {
      const topVendorEntry = cat.vendors[0];
      const topVendor = topVendorEntry
        ? {
            name: topVendorEntry.vendor.name,
            slug: topVendorEntry.vendor.slug,
            score: topVendorEntry.categoryScore ?? topVendorEntry.vendor.overallScore,
          }
        : null;

      // Determine health based on most recent vendor update in category
      let health: "fresh" | "aging" | "stale" = "stale";
      if (cat.vendors.length > 0) {
        const latestUpdate = cat.vendors.reduce((latest, vc) => {
          return vc.vendor.updatedAt > latest ? vc.vendor.updatedAt : latest;
        }, new Date(0));
        const daysSince = (now.getTime() - latestUpdate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < FRESH_DAYS) health = "fresh";
        else if (daysSince < AGING_DAYS) health = "aging";
      }

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        vendorCount: cat._count.vendors,
        topVendor,
        health,
      };
    });

    return NextResponse.json({
      stats: {
        vendors: vendorCount,
        categories: categories.length,
        benchmarks: benchmarkCount,
        dataPoints: vendorCount + benchmarkCount + scoreCount,
        evaluations: evaluationCount,
        news: recentNews.length,
      },
      categories: categoryData,
      news: recentNews,
      agentRuns,
    });
  } catch (error) {
    console.error("Dashboard data fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
