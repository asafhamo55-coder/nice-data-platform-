/**
 * E2E Test: Trigger Agent → See Results Flow
 *
 * Simulates:
 * 1. Trigger vendor scout agent
 * 2. Trigger news collector agent
 * 3. Trigger full data refresh (SSE stream)
 * 4. Verify dashboard reflects updated data
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mock Prisma ─────────────────────────────────────────────────

const mockPrisma = {
  vendor: { count: vi.fn().mockResolvedValue(15), findMany: vi.fn().mockResolvedValue([]) },
  category: { count: vi.fn().mockResolvedValue(12), findMany: vi.fn().mockResolvedValue([]) },
  benchmarkResult: { count: vi.fn().mockResolvedValue(50), findMany: vi.fn().mockResolvedValue([]) },
  vendorScore: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(100) },
  evaluation: { count: vi.fn().mockResolvedValue(5) },
  newsItem: { count: vi.fn().mockResolvedValue(30), findMany: vi.fn().mockResolvedValue([]) },
  agentRun: {
    findMany: vi.fn().mockResolvedValue([
      {
        id: "ar1",
        agentType: "vendor-scout",
        status: "completed",
        startedAt: new Date(),
        completedAt: new Date(),
        summary: { vendorsCreated: 5 },
      },
    ]),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}));

// Mock agents
vi.mock("@/lib/agents/vendor-scout", () => ({
  scoutVendors: vi.fn().mockResolvedValue({
    runId: "scout-run-1",
    categoriesScanned: 12,
    newVendorsCreated: 5,
    vendorsUpdated: 3,
    githubUpdates: 2,
    rankingsRecalculated: true,
    durationMs: 2500,
  }),
}));

vi.mock("@/lib/agents/news-collector", () => ({
  collectNews: vi.fn().mockResolvedValue({
    runId: "news-run-1",
    collected: 15,
    duplicatesSkipped: 3,
    totalInDb: 45,
    durationMs: 1200,
  }),
}));

vi.mock("@/lib/agents/data-refresh-engine", () => ({
  runFullRefresh: vi.fn().mockImplementation(async (emit: (step: unknown) => void) => {
    // Simulate the 7-step pipeline
    const steps = [
      "Check data freshness",
      "Collect news",
      "Scout vendors",
      "Update GitHub metrics",
      "Recalculate rankings",
      "Update benchmarks",
      "Generate quality report",
    ];
    for (let i = 0; i < steps.length; i++) {
      emit({
        type: "step",
        step: i + 1,
        totalSteps: 7,
        name: steps[i],
        status: "complete",
        durationMs: 100 + i * 50,
      });
    }
    return {
      steps: steps.map((name, i) => ({
        step: i + 1,
        name,
        status: "complete",
        durationMs: 100 + i * 50,
      })),
      durationMs: 2800,
      qualityIssues: [],
      timestamp: new Date().toISOString(),
    };
  }),
}));

beforeEach(() => vi.clearAllMocks());

// ─── Helper ──────────────────────────────────────────────────────

function makeRequest(url: string, method = "POST", body?: unknown) {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

// ─── E2E Flow ────────────────────────────────────────────────────

describe("E2E: Trigger Agent → See Results", () => {
  it("Step 1: Trigger vendor scout and verify results", async () => {
    const { POST } = await import("@/app/api/agents/vendor-scout/trigger/route");
    const res = await POST(makeRequest("http://localhost:3000/api/agents/vendor-scout/trigger"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.runId).toBe("scout-run-1");
    expect(data.categoriesScanned).toBe(12);
    expect(data.newVendorsCreated).toBe(5);
    expect(data.vendorsUpdated).toBe(3);
    expect(data.githubUpdates).toBe(2);
    expect(data.rankingsRecalculated).toBe(true);
    expect(data.durationMs).toBeGreaterThan(0);
  });

  it("Step 2: Trigger news collector and verify results", async () => {
    const { POST } = await import("@/app/api/agents/news-collector/trigger/route");
    const res = await POST(makeRequest("http://localhost:3000/api/agents/news-collector/trigger"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.runId).toBe("news-run-1");
    expect(data.collected).toBe(15);
    expect(data.duplicatesSkipped).toBe(3);
    expect(data.totalInDb).toBe(45);
    expect(data.durationMs).toBeGreaterThan(0);
  });

  it("Step 3: Trigger full refresh and stream SSE events", async () => {
    const { POST } = await import("@/app/api/agents/refresh-all/route");
    const res = await POST(makeRequest("http://localhost:3000/api/agents/refresh-all"));

    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
    expect(res.body).toBeTruthy();

    // Read the SSE stream
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let done = false;

    while (!done) {
      const result = await reader.read();
      if (result.done) {
        done = true;
      } else {
        fullText += decoder.decode(result.value, { stream: true });
      }
    }

    // Parse SSE events (each line starting with "data: ")
    const events = fullText
      .split("\n")
      .filter((line) => line.startsWith("data: "))
      .map((line) => {
        try {
          return JSON.parse(line.slice(6));
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    expect(events.length).toBeGreaterThan(0);

    // Should have step and/or summary events
    const stepEvents = events.filter((e: { type: string }) => e.type === "step");
    expect(stepEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("Step 4: Verify dashboard reflects data after agents run", async () => {
    const { GET } = await import("@/app/api/dashboard/route");

    // Promise.all: vendor.count, category.findMany, newsItem.findMany, agentRun.findMany, benchmarkResult.count, evaluation.count
    mockPrisma.vendor.count.mockResolvedValueOnce(20);
    mockPrisma.category.findMany.mockResolvedValueOnce([]);
    mockPrisma.newsItem.findMany.mockResolvedValueOnce([{ id: "n1" }, { id: "n2" }]);
    mockPrisma.agentRun.findMany.mockResolvedValueOnce([
      { id: "ar1", agent: "vendor-scout", status: "completed", startedAt: new Date(), completedAt: new Date(), itemsFound: 5, durationMs: 1000, error: null },
      { id: "ar2", agent: "news-collector", status: "completed", startedAt: new Date(), completedAt: new Date(), itemsFound: 15, durationMs: 500, error: null },
    ]);
    mockPrisma.benchmarkResult.count.mockResolvedValueOnce(60);
    mockPrisma.evaluation.count.mockResolvedValueOnce(5);
    // Then vendorScore.count called separately
    mockPrisma.vendorScore.count.mockResolvedValueOnce(100);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.stats).toBeDefined();
    expect(data.stats.vendors).toBe(20);
    // news count = recentNews.length (the findMany result)
    expect(data.stats.news).toBe(2);
    expect(data.agentRuns).toHaveLength(2);
  });

  it("Full flow: scout → collect → refresh → dashboard", async () => {
    // This test runs the complete flow end-to-end

    // 1. Scout
    const { POST: scoutPost } = await import("@/app/api/agents/vendor-scout/trigger/route");
    const scoutRes = await scoutPost(makeRequest("http://localhost:3000/api/agents/vendor-scout/trigger"));
    expect(scoutRes.status).toBe(200);

    // 2. Collect news
    const { POST: newsPost } = await import("@/app/api/agents/news-collector/trigger/route");
    const newsRes = await newsPost(makeRequest("http://localhost:3000/api/agents/news-collector/trigger"));
    expect(newsRes.status).toBe(200);

    // 3. Refresh all
    const { POST: refreshPost } = await import("@/app/api/agents/refresh-all/route");
    const refreshRes = await refreshPost(makeRequest("http://localhost:3000/api/agents/refresh-all"));
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.headers.get("Content-Type")).toBe("text/event-stream");

    // 4. Dashboard check
    const { GET: dashGet } = await import("@/app/api/dashboard/route");
    // Promise.all order: vendor.count, category.findMany, newsItem.findMany, agentRun.findMany, benchmarkResult.count, evaluation.count
    mockPrisma.vendor.count.mockResolvedValueOnce(25);
    mockPrisma.category.findMany.mockResolvedValueOnce([]);
    mockPrisma.newsItem.findMany.mockResolvedValueOnce([{ id: "n1" }]);
    mockPrisma.agentRun.findMany.mockResolvedValueOnce([]);
    mockPrisma.benchmarkResult.count.mockResolvedValueOnce(75);
    mockPrisma.evaluation.count.mockResolvedValueOnce(8);
    mockPrisma.vendorScore.count.mockResolvedValueOnce(200);

    const dashRes = await dashGet();
    const dashData = await dashRes.json();
    expect(dashData.stats.vendors).toBe(25);
    expect(dashData.stats.news).toBe(1); // recentNews.length
  });
});
