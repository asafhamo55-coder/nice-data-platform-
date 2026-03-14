import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────────────

interface ChatRequestMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Context Builder ────────────────────────────────────────────

async function buildSystemContext(): Promise<string> {
  const [vendors, benchmarks, news] = await Promise.all([
    prisma.vendor.findMany({
      select: {
        name: true,
        tier: true,
        overallScore: true,
        overallRank: true,
        categories: {
          select: {
            isPrimary: true,
            categoryScore: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { overallRank: "asc" },
      take: 30,
    }),
    prisma.benchmarkResult.findMany({
      select: {
        value: true,
        benchmark: { select: { name: true, unit: true, higherIsBetter: true } },
        vendor: { select: { name: true } },
      },
      orderBy: { testDate: "desc" },
      take: 50,
    }),
    prisma.newsItem.findMany({
      select: {
        title: true,
        summary: true,
        source: true,
        newsCategory: true,
        relevance: true,
        publishedAt: true,
        tags: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
    }),
  ]);

  // Format vendor summary
  const vendorSummary = vendors.length > 0
    ? vendors
        .map((v) => {
          const cats = v.categories
            .filter((c) => c.isPrimary)
            .map((c) => c.category.name)
            .join(", ");
          return `- ${v.name} (${v.tier}, rank #${v.overallRank ?? "N/A"}, score ${v.overallScore?.toFixed(1) ?? "N/A"}) — ${cats || "uncategorized"}`;
        })
        .join("\n")
    : "No vendors loaded yet.";

  // Format benchmarks
  const benchmarkSummary = benchmarks.length > 0
    ? benchmarks
        .map(
          (b) =>
            `- ${b.vendor.name}: ${b.benchmark.name} = ${b.value}${b.benchmark.unit ? ` ${b.benchmark.unit}` : ""} (${b.benchmark.higherIsBetter ? "higher better" : "lower better"})`
        )
        .join("\n")
    : "No benchmarks available.";

  // Format news
  const newsSummary = news.length > 0
    ? news
        .map(
          (n) =>
            `- [${n.newsCategory}] ${n.title} (${n.source ?? "unknown"}, ${n.publishedAt.toISOString().split("T")[0]}, relevance ${n.relevance}/10)${n.summary ? `: ${n.summary}` : ""}`
        )
        .join("\n")
    : "No recent news.";

  return `You are the AI Assistant for the NICE Data Platform Center of Excellence (DP-CoE).

NICE is a global enterprise evaluating and managing data platform technologies across 12 categories:
Cloud Data Warehouses, ETL & Data Integration, BI & Analytics, Data Governance, Streaming & Real-Time,
Data Lakehouse, ML & AI Platforms, Data Orchestration, Data Quality, Data Catalog, Database Engines,
and Developer Tools.

Your role is to help NICE's data architecture team with:
- Vendor comparison and evaluation (strengths, weaknesses, fit for NICE)
- Technology selection advice grounded in benchmarks and scores
- Data platform architecture recommendations
- Industry news analysis and implications
- Build vs buy analysis for data infrastructure
- Best practices for data engineering and governance

Always be specific, actionable, and reference the data below when relevant.
When you don't have enough data, use web_search to find current information.

═══ TOP VENDORS ═══
${vendorSummary}

═══ BENCHMARK SCORES ═══
${benchmarkSummary}

═══ RECENT NEWS (last 20 items) ═══
${newsSummary}

═══ NICE ARCHITECTURE CONTEXT ═══
- Multi-tenant SaaS environment with strict data isolation
- Primary cloud: AWS with secondary Azure presence
- Current data volume: ~50TB analytical data, growing 30% YoY
- Key requirements: real-time analytics, regulatory compliance (GDPR, SOC2), cost optimization
- Team: 15 data engineers, 8 analysts, 4 ML engineers
- Current stack under evaluation for modernization

Guidelines:
- Reference specific vendor scores and benchmarks when comparing options
- Note recent news that may affect recommendations
- Consider NICE's multi-tenant SaaS context for architecture advice
- Provide pros/cons tables when comparing alternatives
- Be concise but thorough — aim for well-structured responses with headers and bullet points`;
}

// ─── Streaming Endpoint ─────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages: ChatRequestMessage[] = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt = await buildSystemContext();
    const client = new Anthropic();

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 5,
        },
      ],
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Create a ReadableStream that emits SSE events
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta") {
              const delta = event.delta;
              if (delta.type === "text_delta") {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "text", text: delta.text })}\n\n`)
                );
              } else if (delta.type === "input_json_delta") {
                // Tool use in progress — signal searching
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "tool_use", status: "searching" })}\n\n`)
                );
              }
            } else if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "tool_start", tool: event.content_block.name })}\n\n`)
                );
              }
            } else if (event.type === "content_block_stop") {
              // Block ended — could be tool result coming next
            } else if (event.type === "message_stop") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
              );
            }
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: errMsg })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Assistant chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to start chat stream" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
