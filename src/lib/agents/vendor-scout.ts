/**
 * Vendor Scout Agent
 *
 * Scans all 12 categories for new and updated vendors using
 * Anthropic web_search, GitHub API, and vendor websites.
 * Discovers new vendors, updates existing ones, refreshes
 * GitHub stars, and triggers score recalculation.
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import {
  rankVendorsInCategory,
  computeGlobalRankings,
} from "@/lib/scoring/engine";
import type { CriterionScore } from "@/lib/scoring/engine";

// ─── Types ──────────────────────────────────────────────────────

export interface ScoutResult {
  runId: string;
  status: "completed" | "failed";
  categoriesScanned: number;
  newVendorsCreated: number;
  vendorsUpdated: number;
  githubUpdates: number;
  rankingsRecalculated: boolean;
  durationMs: number;
  error?: string;
}

interface DiscoveredVendor {
  name: string;
  slug: string;
  description: string;
  website: string;
  founded: number | null;
  hqLocation: string | null;
  tier: string;
  categorySlug: string;
  pricingModel: string | null;
  pricingUrl: string | null;
  githubOrg: string | null;
  githubRepo: string | null;
  keyProducts: string[];
  estimatedScores: {
    criterionKey: string;
    score: number;
    confidence: number;
    rationale: string;
  }[];
}

interface GitHubRepoInfo {
  stars: number;
  latestRelease: string | null;
  releaseDate: string | null;
  language: string | null;
}

// ─── Constants ──────────────────────────────────────────────────

const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  "cloud-data-warehouses": ["cloud data warehouse", "analytical database", "OLAP cloud"],
  "etl-data-integration": ["ETL tool", "data integration platform", "ELT pipeline"],
  "bi-analytics": ["business intelligence tool", "BI analytics platform", "data visualization"],
  "data-governance": ["data governance platform", "data catalog tool", "metadata management"],
  "ai-ml-platforms": ["MLOps platform", "AI ML platform", "machine learning tool"],
  "data-quality": ["data quality tool", "data observability platform", "data reliability"],
  "stream-processing": ["stream processing tool", "real-time data platform", "event streaming"],
  "data-lakes": ["data lakehouse platform", "data lake tool", "Apache Iceberg platform"],
  "api-management": ["API management platform", "API gateway tool", "API developer platform"],
  "data-security": ["data security platform", "data privacy tool", "data encryption platform"],
  "cloud-platforms": ["cloud platform infrastructure", "cloud provider data services"],
  "reverse-etl": ["reverse ETL tool", "data activation platform", "operational analytics"],
};

const VENDOR_SYSTEM_PROMPT = `You are the Vendor Scout for NICE DP-CoE (Data Platform Center of Excellence).

Your job is to discover and research data platform vendors in specific categories.
For each vendor you find, provide structured information.

Return results as a JSON code block with this format:

\`\`\`json
[
  {
    "name": "Vendor Name",
    "slug": "vendor-name",
    "description": "2-3 sentence description of the vendor and its core offering",
    "website": "https://vendorsite.com",
    "founded": 2020,
    "hqLocation": "San Francisco, CA",
    "tier": "emerging",
    "pricingModel": "usage-based",
    "pricingUrl": "https://vendorsite.com/pricing",
    "githubOrg": "vendorname",
    "githubRepo": "main-repo",
    "keyProducts": ["Product A", "Product B"],
    "estimatedScores": [
      {
        "criterionKey": "scalability",
        "score": 7.5,
        "confidence": 0.6,
        "rationale": "Brief reasoning"
      }
    ]
  }
]
\`\`\`

Tier guidelines:
- "leader": Market-defining, >$100M ARR, broad adoption (e.g. Snowflake, Databricks)
- "challenger": Strong product, growing fast, $20-100M ARR
- "emerging": Promising, <$20M ARR or recently launched, innovative
- "niche": Specialized for specific use cases

Scoring guidelines (0-10):
- Only score criteria you have reasonable evidence for
- Set confidence 0.3-0.5 for estimates, 0.6-0.8 for documented features, 0.9+ for benchmarked

Important:
- Only include real, active companies (not defunct or acquired-and-absorbed)
- Prefer vendors that are relevant to enterprise data platforms
- Include both well-known and emerging vendors
- Verify websites are real URLs you found during search`;

// ─── Main Agent Function ────────────────────────────────────────

export async function scoutVendors(): Promise<ScoutResult> {
  const startTime = Date.now();

  const agentRun = await prisma.agentRun.create({
    data: {
      agent: "vendor-scout",
      status: "running",
      input: { categories: Object.keys(CATEGORY_SEARCH_TERMS) },
    },
  });

  try {
    const client = new Anthropic();

    // Load existing data
    const [existingVendors, categories] = await Promise.all([
      prisma.vendor.findMany({
        select: { id: true, name: true, slug: true, website: true },
      }),
      prisma.category.findMany({
        include: {
          criteria: true,
          vendors: { select: { vendorId: true } },
        },
      }),
    ]);

    const vendorSlugSet = new Set(existingVendors.map((v) => v.slug));
    const vendorNameMap = new Map(
      existingVendors.map((v) => [v.name.toLowerCase(), v])
    );
    const categoryMap = new Map(categories.map((c) => [c.slug, c]));

    let newVendorsCreated = 0;
    let vendorsUpdated = 0;
    let githubUpdates = 0;
    let categoriesScanned = 0;

    // Process each category
    for (const [catSlug, searchTerms] of Object.entries(CATEGORY_SEARCH_TERMS)) {
      const category = categoryMap.get(catSlug);
      if (!category) continue;

      categoriesScanned++;

      // Step 1: Search for vendors in this category
      const discovered = await searchCategoryVendors(
        client,
        catSlug,
        searchTerms,
        category.criteria.map((c) => c.key),
        [...vendorSlugSet]
      );

      for (const vendor of discovered) {
        const existingByName = vendorNameMap.get(vendor.name.toLowerCase());
        const existingBySlug = vendorSlugSet.has(vendor.slug);

        if (existingByName || existingBySlug) {
          // ── Update existing vendor ──
          const existing = existingByName ?? existingVendors.find((v) => v.slug === vendor.slug);
          if (!existing) continue;

          const updateData: Record<string, unknown> = {};
          if (vendor.description) updateData.description = vendor.description;
          if (vendor.website && !existing.website) updateData.website = vendor.website;
          if (vendor.hqLocation) updateData.hqLocation = vendor.hqLocation;
          if (vendor.founded) updateData.founded = vendor.founded;

          if (Object.keys(updateData).length > 0) {
            await prisma.vendor.update({
              where: { id: existing.id },
              data: updateData,
            });
            vendorsUpdated++;
          }

          // Update scores if provided
          await upsertVendorScores(existing.id, vendor.estimatedScores, category);
        } else {
          // ── Create new vendor ──
          try {
            const newVendor = await prisma.vendor.create({
              data: {
                name: vendor.name,
                slug: vendor.slug,
                description: vendor.description,
                website: vendor.website,
                founded: vendor.founded,
                hqLocation: vendor.hqLocation,
                tier: vendor.tier,
              },
            });

            // Link to category
            await prisma.vendorCategory.create({
              data: {
                vendorId: newVendor.id,
                categoryId: category.id,
                isPrimary: true,
              },
            });

            // Create products
            for (const productName of vendor.keyProducts) {
              const productSlug = productName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
              await prisma.product.create({
                data: {
                  name: productName,
                  slug: productSlug,
                  vendorId: newVendor.id,
                  pricingModel: vendor.pricingModel,
                  pricingUrl: vendor.pricingUrl,
                },
              });
            }

            // Insert scores
            await upsertVendorScores(newVendor.id, vendor.estimatedScores, category);

            vendorSlugSet.add(vendor.slug);
            vendorNameMap.set(vendor.name.toLowerCase(), {
              id: newVendor.id,
              name: vendor.name,
              slug: vendor.slug,
              website: vendor.website,
            });
            newVendorsCreated++;
          } catch (err) {
            console.warn(`Skipped creating vendor "${vendor.name}":`, err);
          }
        }

        // Step 2: GitHub stats
        if (vendor.githubOrg && vendor.githubRepo) {
          const ghInfo = await fetchGitHubInfo(vendor.githubOrg, vendor.githubRepo);
          if (ghInfo) {
            const vendorRecord =
              vendorNameMap.get(vendor.name.toLowerCase());
            if (vendorRecord) {
              // Store GitHub stars as a benchmark result
              await upsertGitHubBenchmark(vendorRecord.id, ghInfo);
              githubUpdates++;
            }
          }
        }
      }
    }

    // Step 3: Recalculate rankings
    const rankingsRecalculated = await recalculateAllRankings();

    const durationMs = Date.now() - startTime;

    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: "completed",
        output: {
          categoriesScanned,
          newVendorsCreated,
          vendorsUpdated,
          githubUpdates,
          rankingsRecalculated,
        },
        itemsFound: newVendorsCreated,
        completedAt: new Date(),
        durationMs,
      },
    });

    return {
      runId: agentRun.id,
      status: "completed",
      categoriesScanned,
      newVendorsCreated,
      vendorsUpdated,
      githubUpdates,
      rankingsRecalculated,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

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
      categoriesScanned: 0,
      newVendorsCreated: 0,
      vendorsUpdated: 0,
      githubUpdates: 0,
      rankingsRecalculated: false,
      durationMs,
      error: errorMessage,
    };
  }
}

// ─── Category Vendor Search ─────────────────────────────────────

async function searchCategoryVendors(
  client: Anthropic,
  categorySlug: string,
  searchTerms: string[],
  criterionKeys: string[],
  existingSlugs: string[]
): Promise<DiscoveredVendor[]> {
  const searchQueries = [
    `${searchTerms[0]} tools comparison 2026`,
    `new ${searchTerms[0]} startup tool launch 2026`,
  ];

  const userPrompt = `Search for data platform vendors in the "${categorySlug}" category.

Use web_search with these queries:
${searchQueries.map((q, i) => `${i + 1}. "${q}"`).join("\n")}

Also search for:
- "${searchTerms.slice(1).join('" and "')}" to find additional vendors

Already known vendors (slugs): ${existingSlugs.slice(0, 30).join(", ")}

For new vendors NOT in the list above, and for existing vendors where you find updated info, return detailed information.

Available scoring criteria for this category: ${criterionKeys.join(", ")}

For each vendor, estimate scores on the available criteria based on what you find.
Also try to find:
- Their pricing page URL and pricing model type (usage-based, seat-based, credit-based, free, open-source, enterprise)
- Their GitHub organization/repo if they have open source components
- Their founding year and HQ location

Return at least 3-5 vendors, focusing on a mix of established players and emerging tools.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: VENDOR_SYSTEM_PROMPT,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 10,
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

    return parseDiscoveredVendors(response, categorySlug);
  } catch (err) {
    console.warn(`Search failed for category "${categorySlug}":`, err);
    return [];
  }
}

// ─── Response Parser ────────────────────────────────────────────

function parseDiscoveredVendors(
  response: Anthropic.Message,
  categorySlug: string
): DiscoveredVendor[] {
  for (const block of response.content) {
    if (block.type !== "text") continue;

    const jsonMatch = block.text.match(/```json\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : block.text;
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (!arrayMatch) continue;

    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (!Array.isArray(parsed)) continue;

      return parsed
        .filter(
          (item: Record<string, unknown>) =>
            typeof item.name === "string" && typeof item.website === "string"
        )
        .map(
          (item: Record<string, unknown>): DiscoveredVendor => ({
            name: String(item.name),
            slug:
              typeof item.slug === "string"
                ? item.slug
                : String(item.name)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, ""),
            description: String(item.description ?? ""),
            website: String(item.website),
            founded: typeof item.founded === "number" ? item.founded : null,
            hqLocation:
              typeof item.hqLocation === "string" ? item.hqLocation : null,
            tier: validateTier(String(item.tier ?? "emerging")),
            categorySlug,
            pricingModel:
              typeof item.pricingModel === "string" ? item.pricingModel : null,
            pricingUrl:
              typeof item.pricingUrl === "string" ? item.pricingUrl : null,
            githubOrg:
              typeof item.githubOrg === "string" ? item.githubOrg : null,
            githubRepo:
              typeof item.githubRepo === "string" ? item.githubRepo : null,
            keyProducts: Array.isArray(item.keyProducts)
              ? item.keyProducts.map(String)
              : [],
            estimatedScores: Array.isArray(item.estimatedScores)
              ? item.estimatedScores
                  .filter(
                    (s: Record<string, unknown>) =>
                      typeof s.criterionKey === "string" &&
                      typeof s.score === "number"
                  )
                  .map(
                    (s: Record<string, unknown>) => ({
                      criterionKey: String(s.criterionKey),
                      score: Math.max(0, Math.min(10, Number(s.score))),
                      confidence: Math.max(
                        0.1,
                        Math.min(1, Number(s.confidence ?? 0.5))
                      ),
                      rationale: String(s.rationale ?? ""),
                    })
                  )
              : [],
          })
        );
    } catch {
      continue;
    }
  }

  return [];
}

// ─── GitHub API ─────────────────────────────────────────────────

async function fetchGitHubInfo(
  org: string,
  repo: string
): Promise<GitHubRepoInfo | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "NICE-DP-CoE-VendorScout",
    };

    // Use token if available
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const repoRes = await fetch(
      `https://api.github.com/repos/${org}/${repo}`,
      { headers, signal: AbortSignal.timeout(10000) }
    );

    if (!repoRes.ok) return null;

    const repoData = await repoRes.json();

    // Fetch latest release
    let latestRelease: string | null = null;
    let releaseDate: string | null = null;

    try {
      const releaseRes = await fetch(
        `https://api.github.com/repos/${org}/${repo}/releases/latest`,
        { headers, signal: AbortSignal.timeout(10000) }
      );
      if (releaseRes.ok) {
        const releaseData = await releaseRes.json();
        latestRelease = releaseData.tag_name ?? null;
        releaseDate = releaseData.published_at ?? null;
      }
    } catch {
      // No releases — that's fine
    }

    return {
      stars: repoData.stargazers_count ?? 0,
      latestRelease,
      releaseDate,
      language: repoData.language ?? null,
    };
  } catch {
    return null;
  }
}

// ─── Database Helpers ───────────────────────────────────────────

async function upsertVendorScores(
  vendorId: string,
  scores: DiscoveredVendor["estimatedScores"],
  category: { id: string; criteria: { id: string; key: string }[] }
): Promise<void> {
  const criterionKeyMap = new Map(
    category.criteria.map((c) => [c.key, c.id])
  );

  for (const score of scores) {
    const criterionId = criterionKeyMap.get(score.criterionKey);
    if (!criterionId) continue;

    try {
      await prisma.vendorScore.upsert({
        where: {
          vendorId_criterionId: { vendorId, criterionId },
        },
        create: {
          vendorId,
          criterionId,
          score: score.score,
          confidence: score.confidence,
          source: "vendor-scout",
          notes: score.rationale,
        },
        update: {
          score: score.score,
          confidence: score.confidence,
          source: "vendor-scout",
          notes: score.rationale,
        },
      });
    } catch (err) {
      console.warn(`Failed to upsert score for vendor ${vendorId}:`, err);
    }
  }
}

async function upsertGitHubBenchmark(
  vendorId: string,
  ghInfo: GitHubRepoInfo
): Promise<void> {
  // Find the vendor's primary category for the benchmark
  const vendorCat = await prisma.vendorCategory.findFirst({
    where: { vendorId, isPrimary: true },
    select: { categoryId: true },
  });
  if (!vendorCat) return;

  // Find or create the "GitHub Stars" benchmark for this category
  let starsBenchmark = await prisma.benchmark.findUnique({
    where: { key: "github-stars" },
  });

  if (!starsBenchmark) {
    starsBenchmark = await prisma.benchmark.create({
      data: {
        name: "GitHub Stars",
        key: "github-stars",
        unit: "stars",
        higherIsBetter: true,
        description: "Number of GitHub stars for the primary repository",
        categoryId: vendorCat.categoryId,
      },
    });
  }

  await prisma.benchmarkResult.upsert({
    where: {
      benchmarkId_vendorId: {
        vendorId,
        benchmarkId: starsBenchmark.id,
      },
    },
    create: {
      vendorId,
      benchmarkId: starsBenchmark.id,
      value: ghInfo.stars,
      testDate: new Date(),
      notes: ghInfo.latestRelease
        ? `Latest release: ${ghInfo.latestRelease} (${ghInfo.releaseDate ?? "unknown date"})`
        : null,
    },
    update: {
      value: ghInfo.stars,
      testDate: new Date(),
      notes: ghInfo.latestRelease
        ? `Latest release: ${ghInfo.latestRelease} (${ghInfo.releaseDate ?? "unknown date"})`
        : null,
    },
  });
}

// ─── Rankings Recalculation ─────────────────────────────────────

async function recalculateAllRankings(): Promise<boolean> {
  try {
    const categories = await prisma.category.findMany({
      include: {
        criteria: true,
        vendors: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                slug: true,
                tier: true,
                scores: { include: { criterion: true } },
              },
            },
          },
        },
      },
    });

    const categoryRankingsMap = new Map<
      string,
      {
        rankings: ReturnType<typeof rankVendorsInCategory>;
        totalWeight: number;
        color: string | null;
      }
    >();

    for (const cat of categories) {
      const criterionIds = new Set(cat.criteria.map((c) => c.id));
      const totalWeight = cat.criteria.reduce((sum, c) => sum + c.weight, 0);

      const vendorScores = cat.vendors.map((vc) => {
        const relevantScores: CriterionScore[] = vc.vendor.scores
          .filter((s) => criterionIds.has(s.criterionId))
          .map((s) => ({
            criterionId: s.criterion.id,
            criterionKey: s.criterion.key,
            criterionName: s.criterion.name,
            score: s.score,
            weight: s.criterion.weight,
            confidence: s.confidence,
          }));

        return {
          vendorId: vc.vendor.id,
          vendorName: vc.vendor.name,
          vendorSlug: vc.vendor.slug,
          scores: relevantScores,
        };
      });

      const rankings = rankVendorsInCategory(vendorScores, cat.id, cat.name);
      categoryRankingsMap.set(cat.id, {
        rankings,
        totalWeight,
        color: cat.color,
      });

      // Persist category-level scores and ranks
      for (const r of rankings) {
        await prisma.vendorCategory.updateMany({
          where: { vendorId: r.vendorId, categoryId: cat.id },
          data: { categoryScore: r.normalizedScore, categoryRank: r.rank },
        });
      }
    }

    // Compute and persist global rankings
    const globalRankings = computeGlobalRankings(categoryRankingsMap);
    for (const r of globalRankings) {
      await prisma.vendor.update({
        where: { id: r.vendorId },
        data: { overallScore: r.overallScore, overallRank: r.overallRank },
      });
    }

    return true;
  } catch (err) {
    console.error("Ranking recalculation failed:", err);
    return false;
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function validateTier(tier: string): string {
  return ["leader", "challenger", "emerging", "niche"].includes(tier)
    ? tier
    : "emerging";
}
