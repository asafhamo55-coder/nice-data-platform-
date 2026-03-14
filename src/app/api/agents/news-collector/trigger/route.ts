import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simulated news data the collector "finds" — in production this would call
// an external scraping / AI agent service and stream results back.

const NEWS_CATEGORIES = [
  "product_launch",
  "funding",
  "partnership",
  "acquisition",
  "industry_report",
  "regulation",
  "open_source",
  "benchmark",
  "migration",
  "general",
] as const;

interface CollectedItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  sourceIcon: string;
  newsCategory: string;
  sentiment: string;
  relevance: number;
  tags: string[];
  publishedAt: Date;
  vendorId?: string;
  categoryId?: string;
}

export async function POST() {
  try {
    // 1. Fetch vendors and categories for realistic linking
    const [vendors, categories] = await Promise.all([
      prisma.vendor.findMany({ select: { id: true, name: true } }),
      prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
    ]);

    if (vendors.length === 0) {
      return NextResponse.json(
        { error: "No vendors found — seed the database first" },
        { status: 400 }
      );
    }

    // 2. Generate a batch of realistic news items
    const now = new Date();
    const items: CollectedItem[] = generateNewsItems(vendors, categories, now);

    // 3. Upsert into database (skip duplicates by URL)
    const existing = new Set(
      (await prisma.newsItem.findMany({ select: { url: true } })).map((n) => n.url)
    );
    const newItems = items.filter((i) => !existing.has(i.url));

    if (newItems.length > 0) {
      await prisma.newsItem.createMany({
        data: newItems.map((i) => ({
          title: i.title,
          summary: i.summary,
          url: i.url,
          source: i.source,
          sourceIcon: i.sourceIcon,
          newsCategory: i.newsCategory,
          sentiment: i.sentiment,
          relevance: i.relevance,
          tags: i.tags,
          publishedAt: i.publishedAt,
          vendorId: i.vendorId ?? null,
          categoryId: i.categoryId ?? null,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      collected: newItems.length,
      duplicatesSkipped: items.length - newItems.length,
      totalInDb: existing.size + newItems.length,
    });
  } catch (error) {
    console.error("News collector trigger failed:", error);
    return NextResponse.json(
      { error: "Failed to collect news" },
      { status: 500 }
    );
  }
}

// ─── News Generation ─────────────────────────────────────────────

function generateNewsItems(
  vendors: { id: string; name: string }[],
  categories: { id: string; name: string; slug: string }[],
  now: Date
): CollectedItem[] {
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const hours = (h: number) => new Date(now.getTime() - h * 3600_000);
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const SOURCES = [
    { name: "TechCrunch", icon: "/favicons/techcrunch.png" },
    { name: "InfoWorld", icon: "/favicons/infoworld.png" },
    { name: "The New Stack", icon: "/favicons/thenewstack.png" },
    { name: "Datanami", icon: "/favicons/datanami.png" },
    { name: "VentureBeat", icon: "/favicons/venturebeat.png" },
    { name: "ZDNet", icon: "/favicons/zdnet.png" },
    { name: "Forbes Tech", icon: "/favicons/forbes.png" },
    { name: "DB-Engines", icon: "/favicons/dbengines.png" },
  ];

  const templates: {
    titleFn: (v: string) => string;
    summaryFn: (v: string) => string;
    cat: (typeof NEWS_CATEGORIES)[number];
    sentiment: string;
    relevanceRange: [number, number];
    tagsFn: () => string[];
  }[] = [
    {
      titleFn: (v) => `${v} Announces Major Platform Update with AI-Native Features`,
      summaryFn: (v) =>
        `${v} has unveiled significant platform enhancements including AI-assisted query optimization, automated schema management, and intelligent data pipeline recommendations. The update positions ${v} as a frontrunner in the AI-augmented data platform space.`,
      cat: "product_launch",
      sentiment: "positive",
      relevanceRange: [7, 10],
      tagsFn: () => ["AI", "product-update", "platform"],
    },
    {
      titleFn: (v) => `${v} Raises $200M Series D to Expand Enterprise Data Cloud`,
      summaryFn: (v) =>
        `${v} secured a $200M funding round led by top-tier VCs, valuing the company at $3.2B. The investment will fuel expansion into European markets and accelerate development of their real-time streaming capabilities.`,
      cat: "funding",
      sentiment: "positive",
      relevanceRange: [6, 9],
      tagsFn: () => ["funding", "enterprise", "growth"],
    },
    {
      titleFn: (v) => `${v} Partners with Major Cloud Provider for Seamless Integration`,
      summaryFn: (v) =>
        `A new strategic partnership between ${v} and a leading hyperscaler enables zero-copy data sharing and unified billing. Enterprise customers can now provision ${v} resources directly from their cloud console.`,
      cat: "partnership",
      sentiment: "positive",
      relevanceRange: [5, 8],
      tagsFn: () => ["partnership", "cloud", "integration"],
    },
    {
      titleFn: (_v) => `New Industry Report: Data Platform Market to Reach $150B by 2028`,
      summaryFn: (_v) =>
        `Gartner's latest Magic Quadrant report highlights shifting market dynamics in the data platform space. Real-time analytics and AI-driven automation are identified as the top priorities for enterprise data teams in the coming fiscal year.`,
      cat: "industry_report",
      sentiment: "neutral",
      relevanceRange: [8, 10],
      tagsFn: () => ["market-research", "gartner", "trends"],
    },
    {
      titleFn: (v) => `${v} Open-Sources Core Query Engine Under Apache 2.0 License`,
      summaryFn: (v) =>
        `In a move to accelerate community adoption, ${v} has open-sourced its query execution engine. The release includes documentation, benchmarks, and a contributor program aimed at building a robust ecosystem around the technology.`,
      cat: "open_source",
      sentiment: "positive",
      relevanceRange: [6, 9],
      tagsFn: () => ["open-source", "community", "apache"],
    },
    {
      titleFn: (v) => `Benchmark Results: ${v} Leads in TPC-DS Price-Performance`,
      summaryFn: (v) =>
        `Independent TPC-DS benchmarks show ${v} achieving 2.3x better price-performance than competitors at the 10TB scale. The results highlight significant improvements in concurrent query handling and cold-start latency.`,
      cat: "benchmark",
      sentiment: "positive",
      relevanceRange: [7, 10],
      tagsFn: () => ["benchmark", "performance", "TPC-DS"],
    },
    {
      titleFn: (_v) => `EU Data Act Takes Effect: Implications for Cloud Data Platforms`,
      summaryFn: (_v) =>
        `The European Union's Data Act is now in effect, introducing new requirements for data portability, interoperability, and cloud switching. Data platform vendors must implement standardized export formats and provide transparent pricing for egress fees.`,
      cat: "regulation",
      sentiment: "neutral",
      relevanceRange: [7, 9],
      tagsFn: () => ["regulation", "EU", "compliance", "data-act"],
    },
    {
      titleFn: (v) => `${v} Acquires Real-Time Analytics Startup for $500M`,
      summaryFn: (v) =>
        `${v} has completed the acquisition of a promising real-time analytics startup, adding sub-second query capabilities to its platform. The deal is expected to close next quarter and will integrate the startup's streaming engine into ${v}'s core product.`,
      cat: "acquisition",
      sentiment: "positive",
      relevanceRange: [7, 9],
      tagsFn: () => ["acquisition", "real-time", "M&A"],
    },
    {
      titleFn: (v) => `Enterprise Migration Guide: Moving from Legacy DW to ${v}`,
      summaryFn: (v) =>
        `A comprehensive migration guide has been published detailing best practices for transitioning from on-premise data warehouses to ${v}. The guide covers schema conversion, data transfer strategies, and performance optimization techniques.`,
      cat: "migration",
      sentiment: "neutral",
      relevanceRange: [4, 7],
      tagsFn: () => ["migration", "enterprise", "best-practices"],
    },
    {
      titleFn: (v) => `${v} Adds Native Vector Search and Embedding Support`,
      summaryFn: (v) =>
        `${v} now supports native vector search capabilities, enabling AI/ML workloads directly within the data platform. Users can store, index, and query embeddings alongside structured data without external vector database dependencies.`,
      cat: "product_launch",
      sentiment: "positive",
      relevanceRange: [8, 10],
      tagsFn: () => ["AI", "vector-search", "embeddings", "ML"],
    },
    {
      titleFn: (_v) => `Data Lakehouse Architecture Adoption Surges 45% Year-over-Year`,
      summaryFn: (_v) =>
        `A new survey of 1,200 data leaders reveals a 45% increase in lakehouse architecture adoption. Organizations cite cost reduction, simplified governance, and unified analytics as the primary drivers behind the shift from traditional warehouse-only approaches.`,
      cat: "industry_report",
      sentiment: "neutral",
      relevanceRange: [6, 8],
      tagsFn: () => ["lakehouse", "trends", "survey", "architecture"],
    },
    {
      titleFn: (v) => `${v} Launches Serverless Tier with Pay-Per-Query Pricing`,
      summaryFn: (v) =>
        `${v} introduces a new serverless consumption tier that eliminates idle compute costs. The pay-per-query model automatically scales from zero and includes built-in cost controls, making it accessible for startups and small data teams.`,
      cat: "product_launch",
      sentiment: "positive",
      relevanceRange: [5, 8],
      tagsFn: () => ["serverless", "pricing", "cost-optimization"],
    },
  ];

  const results: CollectedItem[] = [];
  const usedUrls = new Set<string>();

  // Generate 8-15 items per collection run
  const count = rand(8, 15);
  for (let i = 0; i < count; i++) {
    const template = pick(templates);
    const vendor = pick(vendors);
    const category = categories.length > 0 ? pick(categories) : null;
    const source = pick(SOURCES);
    const slug = `${vendor.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${template.cat}-${Date.now()}-${i}`;
    const url = `https://example.com/news/${slug}`;

    if (usedUrls.has(url)) continue;
    usedUrls.add(url);

    results.push({
      title: template.titleFn(vendor.name),
      summary: template.summaryFn(vendor.name),
      url,
      source: source.name,
      sourceIcon: source.icon,
      newsCategory: template.cat,
      sentiment: template.sentiment,
      relevance: rand(...template.relevanceRange),
      tags: template.tagsFn(),
      publishedAt: hours(rand(0, 72)),
      vendorId: template.cat === "industry_report" || template.cat === "regulation" ? undefined : vendor.id,
      categoryId: category?.id,
    });
  }

  return results;
}
