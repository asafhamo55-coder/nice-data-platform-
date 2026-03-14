/**
 * News Collector Agent
 *
 * Uses the Anthropic SDK with web_search tool to find and classify
 * data-platform industry news, then persists results via Prisma.
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────────────

export interface CollectedNewsItem {
  title: string;
  url: string;
  source: string;
  publishedDate: string;
  summary: string;
  newsCategory: string;
  relevance: number;
  sentiment: string;
  tags: string[];
  vendorMentions: string[];
  platformCategory: string | null;
}

export interface CollectionResult {
  runId: string;
  status: "completed" | "failed";
  collected: number;
  duplicatesSkipped: number;
  totalInDb: number;
  durationMs: number;
  error?: string;
}

// ─── Constants ──────────────────────────────────────────────────

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

const SEARCH_QUERIES = [
  "data platform news this week 2026",
  "data engineering tool launch 2026",
  "Snowflake Databricks new features 2026",
  "data lakehouse Apache Iceberg updates",
  "semantic layer news dbt Cube 2026",
  "data governance compliance new tools",
  "real-time streaming Kafka Flink updates",
  "data quality observability news",
  "data catalog Atlan Collibra updates",
  "data orchestration Airflow Dagster news",
] as const;

const SYSTEM_PROMPT = `You are the News Collector for NICE DP-CoE (Data Platform Center of Excellence).

Your job is to search the web for the latest data platform industry news and return structured results.

For each news article you find, extract and return:
- title: The article headline
- url: The full URL
- source: The publication name (e.g. "TechCrunch", "InfoWorld")
- publishedDate: ISO date string (best estimate if exact date unavailable)
- summary: A concise 2-3 sentence summary of the article's key points
- newsCategory: One of: ${NEWS_CATEGORIES.join(", ")}
- relevance: Score 1-10 for how relevant this is to data platform professionals (10 = must-read)
- sentiment: "positive", "neutral", or "negative"
- tags: Array of 2-5 lowercase keyword tags
- vendorMentions: Array of vendor/product names mentioned (e.g. ["Snowflake", "Databricks"])
- platformCategory: The most relevant platform category slug, or null. Categories: cloud-data-warehouses, etl-data-integration, bi-analytics, data-governance, streaming-real-time, data-lakehouse, ml-ai-platforms, data-orchestration, data-quality, data-catalog, database-engines, developer-tools

Important guidelines:
- Only include articles from the past 7 days
- Deduplicate: if the same story appears from multiple sources, pick the best one
- Prioritize articles that are actionable for data platform evaluation and selection
- Assign higher relevance (8-10) to product launches, major funding rounds, and benchmark results
- Assign lower relevance (1-4) to opinion pieces and general commentary
- Be accurate with URLs — only return URLs you actually found via search`;

// ─── Main Agent Function ────────────────────────────────────────

export async function collectNews(): Promise<CollectionResult> {
  const startTime = Date.now();

  // Create the agent run record
  const agentRun = await prisma.agentRun.create({
    data: {
      agent: "news-collector",
      status: "running",
      input: { queries: SEARCH_QUERIES },
    },
  });

  try {
    const client = new Anthropic();

    // Pick 3-4 random queries per run to rotate through topics
    const queries = shuffleAndPick(SEARCH_QUERIES, 4);

    // Fetch existing URLs for deduplication
    const existingUrls = new Set(
      (await prisma.newsItem.findMany({ select: { url: true } })).map((n) => n.url)
    );

    // Fetch vendors and categories for linking
    const [vendors, categories] = await Promise.all([
      prisma.vendor.findMany({ select: { id: true, name: true, slug: true } }),
      prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
    ]);

    const vendorMap = new Map(vendors.map((v) => [v.name.toLowerCase(), v]));
    const categoryMap = new Map(categories.map((c) => [c.slug, c]));

    // Build the user prompt with the selected queries
    const userPrompt = buildUserPrompt(queries);

    // Call Claude with web_search tool
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 10,
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract the structured news items from Claude's response
    const newsItems = parseResponseItems(response);

    // Deduplicate against existing DB items
    const newItems = newsItems.filter((item) => !existingUrls.has(item.url));
    const duplicatesSkipped = newsItems.length - newItems.length;

    // Insert new items into database
    let insertedCount = 0;
    for (const item of newItems) {
      // Try to match vendor mentions to actual vendor records
      const matchedVendor = findMatchingVendor(item.vendorMentions, vendorMap);
      const matchedCategory = item.platformCategory
        ? categoryMap.get(item.platformCategory) ?? null
        : null;

      try {
        await prisma.newsItem.create({
          data: {
            title: item.title,
            summary: item.summary,
            url: item.url,
            source: item.source,
            newsCategory: validateNewsCategory(item.newsCategory),
            sentiment: validateSentiment(item.sentiment),
            relevance: Math.max(1, Math.min(10, item.relevance)),
            tags: item.tags,
            publishedAt: parseDate(item.publishedDate),
            vendorId: matchedVendor?.id ?? null,
            categoryId: matchedCategory?.id ?? null,
          },
        });
        insertedCount++;
      } catch (err) {
        // Skip individual insert failures (e.g. constraint violations)
        console.warn(`Skipped news item "${item.title}":`, err);
      }
    }

    const durationMs = Date.now() - startTime;
    const totalInDb = existingUrls.size + insertedCount;

    // Update agent run record
    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: "completed",
        output: {
          queries,
          itemsFromClaude: newsItems.length,
          inserted: insertedCount,
          duplicatesSkipped,
          totalInDb,
        },
        itemsFound: insertedCount,
        completedAt: new Date(),
        durationMs,
      },
    });

    return {
      runId: agentRun.id,
      status: "completed",
      collected: insertedCount,
      duplicatesSkipped,
      totalInDb,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Mark agent run as failed
    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: "failed",
        error: errorMessage,
        completedAt: new Date(),
        durationMs,
      },
    });

    return {
      runId: agentRun.id,
      status: "failed",
      collected: 0,
      duplicatesSkipped: 0,
      totalInDb: 0,
      durationMs,
      error: errorMessage,
    };
  }
}

// ─── Prompt Builder ─────────────────────────────────────────────

function buildUserPrompt(queries: string[]): string {
  return `Search the web for the latest data platform industry news using these search queries:

${queries.map((q, i) => `${i + 1}. "${q}"`).join("\n")}

For each query, use the web_search tool to find recent articles. Then compile your findings into a single JSON array of news items.

IMPORTANT: Return your final output as a JSON code block with this exact format:

\`\`\`json
[
  {
    "title": "Article Title",
    "url": "https://...",
    "source": "Publication Name",
    "publishedDate": "2026-03-14",
    "summary": "2-3 sentence summary...",
    "newsCategory": "product_launch",
    "relevance": 8,
    "sentiment": "positive",
    "tags": ["tag1", "tag2"],
    "vendorMentions": ["Vendor1", "Vendor2"],
    "platformCategory": "cloud-data-warehouses"
  }
]
\`\`\`

Find as many relevant articles as possible (aim for 8-15 unique articles). Deduplicate across queries — if the same story appears in multiple searches, only include it once.`;
}

// ─── Response Parser ────────────────────────────────────────────

function parseResponseItems(
  response: Anthropic.Message
): CollectedNewsItem[] {
  // Find the text block containing the JSON array
  for (const block of response.content) {
    if (block.type !== "text") continue;

    // Try to extract JSON from code block
    const jsonMatch = block.text.match(/```json\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : block.text;

    // Try to find a JSON array in the text
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (!arrayMatch) continue;

    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (!Array.isArray(parsed)) continue;

      return parsed
        .filter(
          (item: Record<string, unknown>) =>
            typeof item.title === "string" &&
            typeof item.url === "string" &&
            item.url.startsWith("http")
        )
        .map(
          (item: Record<string, unknown>): CollectedNewsItem => ({
            title: String(item.title),
            url: String(item.url),
            source: String(item.source ?? "Unknown"),
            publishedDate: String(item.publishedDate ?? new Date().toISOString()),
            summary: String(item.summary ?? ""),
            newsCategory: String(item.newsCategory ?? "general"),
            relevance: Number(item.relevance) || 5,
            sentiment: String(item.sentiment ?? "neutral"),
            tags: Array.isArray(item.tags)
              ? item.tags.map(String)
              : [],
            vendorMentions: Array.isArray(item.vendorMentions)
              ? item.vendorMentions.map(String)
              : [],
            platformCategory:
              typeof item.platformCategory === "string"
                ? item.platformCategory
                : null,
          })
        );
    } catch {
      // Continue to next block if JSON parsing fails
      continue;
    }
  }

  return [];
}

// ─── Helpers ────────────────────────────────────────────────────

function shuffleAndPick<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function findMatchingVendor(
  mentions: string[],
  vendorMap: Map<string, { id: string; name: string; slug: string }>
): { id: string; name: string; slug: string } | null {
  for (const mention of mentions) {
    const key = mention.toLowerCase();
    // Direct match
    const direct = vendorMap.get(key);
    if (direct) return direct;
    // Partial match
    for (const [vKey, vendor] of vendorMap) {
      if (vKey.includes(key) || key.includes(vKey)) return vendor;
    }
  }
  return null;
}

function validateNewsCategory(cat: string): string {
  const valid: string[] = [...NEWS_CATEGORIES];
  return valid.includes(cat) ? cat : "general";
}

function validateSentiment(s: string): string {
  return ["positive", "neutral", "negative"].includes(s) ? s : "neutral";
}

function parseDate(dateStr: string): Date {
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}
