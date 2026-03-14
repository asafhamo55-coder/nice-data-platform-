/**
 * Integration tests for all API endpoints.
 *
 * These tests mock Prisma and verify:
 * - Correct HTTP method handling
 * - Response shape / status codes
 * - Query parameter handling
 * - Error handling
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mock Prisma ─────────────────────────────────────────────────

const mockPrisma = {
  vendor: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    count: vi.fn().mockResolvedValue(0),
    update: vi.fn().mockResolvedValue({}),
    upsert: vi.fn().mockResolvedValue({}),
  },
  category: {
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
  },
  vendorCategory: {
    findMany: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue({}),
  },
  vendorScore: {
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
  },
  criterion: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  product: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  capability: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  benchmark: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  benchmarkResult: {
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
  },
  evaluation: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: "eval-1" }),
    count: vi.fn().mockResolvedValue(0),
  },
  newsItem: {
    findMany: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
  },
  agentRun: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  standard: {
    findMany: vi.fn().mockResolvedValue([]),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}));

// Mock scoring engine to avoid Prisma dependency
vi.mock("@/lib/scoring/engine", () => ({
  calculateWeightedScore: vi.fn().mockReturnValue(7.5),
  normalizeScore: vi.fn().mockReturnValue(75),
  rankVendorsInCategory: vi.fn().mockReturnValue([]),
  computeGlobalRankings: vi.fn().mockReturnValue([]),
}));

// Mock agents
vi.mock("@/lib/agents/vendor-scout", () => ({
  scoutVendors: vi.fn().mockResolvedValue({
    runId: "run-1",
    categoriesScanned: 12,
    newVendorsCreated: 5,
    vendorsUpdated: 3,
    githubUpdates: 2,
    rankingsRecalculated: true,
    durationMs: 1000,
  }),
}));

vi.mock("@/lib/agents/news-collector", () => ({
  collectNews: vi.fn().mockResolvedValue({
    runId: "run-2",
    collected: 10,
    duplicatesSkipped: 2,
    totalInDb: 50,
    durationMs: 500,
  }),
}));

vi.mock("@/lib/agents/data-refresh-engine", () => ({
  runFullRefresh: vi.fn().mockImplementation(async (emit: (step: unknown) => void) => {
    emit({ type: "step", step: 1, name: "test", status: "complete" });
    return { steps: [], durationMs: 100 };
  }),
}));

// Mock Anthropic
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "Hello" }],
      }),
      stream: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "Hello" } };
          yield { type: "message_stop" };
        },
        finalMessage: vi.fn().mockResolvedValue({ content: [{ type: "text", text: "Hello" }] }),
      }),
    };
  }
  return { default: MockAnthropic };
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Helper ──────────────────────────────────────────────────────

function makeRequest(
  url: string,
  method: string = "GET",
  body?: unknown
): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

// ─── /api/vendors ────────────────────────────────────────────────

describe("GET /api/vendors", () => {
  it("returns vendors array and total", async () => {
    const { GET } = await import("@/app/api/vendors/route");
    const res = await GET(makeRequest("http://localhost:3000/api/vendors"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("vendors");
    expect(data).toHaveProperty("total");
    expect(Array.isArray(data.vendors)).toBe(true);
  });
});

describe("POST /api/vendors", () => {
  it("returns 201 with vendor data", async () => {
    const { POST } = await import("@/app/api/vendors/route");
    const body = { name: "Test Vendor", slug: "test-vendor" };
    const res = await POST(makeRequest("http://localhost:3000/api/vendors", "POST", body));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty("vendor");
  });
});

// ─── /api/categories ─────────────────────────────────────────────

describe("GET /api/categories", () => {
  it("returns categories array", async () => {
    const { GET } = await import("@/app/api/categories/route");
    const res = await GET(makeRequest("http://localhost:3000/api/categories"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("categories");
    expect(Array.isArray(data.categories)).toBe(true);
  });
});

// ─── /api/standards ──────────────────────────────────────────────

describe("GET /api/standards", () => {
  it("returns standards array", async () => {
    const { GET } = await import("@/app/api/standards/route");
    const res = await GET(makeRequest("http://localhost:3000/api/standards"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("standards");
  });
});

// ─── /api/rankings ───────────────────────────────────────────────

describe("GET /api/rankings", () => {
  it("returns rankings array", async () => {
    const { GET } = await import("@/app/api/rankings/route");

    // Mock the chain of Prisma calls the route uses
    mockPrisma.category.findMany.mockResolvedValueOnce([]);

    const res = await GET(makeRequest("http://localhost:3000/api/rankings"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("rankings");
  });
});

// ─── /api/pricing ────────────────────────────────────────────────

describe("POST /api/pricing", () => {
  it("returns cost estimates for vendors", async () => {
    const { POST } = await import("@/app/api/pricing/route");
    const body = {
      vendors: [
        {
          vendorId: "v1",
          vendorName: "TestVendor",
          vendorSlug: "test-vendor",
          tier: "challenger",
          pricingModel: "usage-based",
          category: "storage",
        },
      ],
    };
    const res = await POST(makeRequest("http://localhost:3000/api/pricing", "POST", body));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("estimates");
    expect(data).toHaveProperty("profile");
    expect(data).toHaveProperty("generatedAt");
    expect(data.estimates).toHaveLength(1);
    expect(data.estimates[0]).toHaveProperty("monthly");
    expect(data.estimates[0]).toHaveProperty("annual");
    expect(data.estimates[0]).toHaveProperty("threeYear");
    expect(data.estimates[0]).toHaveProperty("hiddenCosts");
  });

  it("uses medium preset by default", async () => {
    const { POST } = await import("@/app/api/pricing/route");
    const body = {
      vendors: [
        {
          vendorId: "v1",
          vendorName: "Test",
          vendorSlug: "test",
          tier: "challenger",
          pricingModel: "usage-based",
          category: "storage",
        },
      ],
    };
    const res = await POST(makeRequest("http://localhost:3000/api/pricing", "POST", body));
    const data = await res.json();
    expect(data.profile.key).toBe("medium");
  });

  it("accepts a specific workload preset", async () => {
    const { POST } = await import("@/app/api/pricing/route");
    const body = {
      vendors: [
        {
          vendorId: "v1",
          vendorName: "Test",
          vendorSlug: "test",
          tier: "challenger",
          pricingModel: "seat-based",
          category: "analytics",
        },
      ],
      profile: { key: "small" },
    };
    const res = await POST(makeRequest("http://localhost:3000/api/pricing", "POST", body));
    const data = await res.json();
    expect(data.profile.key).toBe("small");
  });
});

// ─── /api/evaluations ────────────────────────────────────────────

describe("GET /api/evaluations", () => {
  it("returns evaluations array", async () => {
    const { GET } = await import("@/app/api/evaluations/route");
    mockPrisma.evaluation.findMany.mockResolvedValueOnce([]);
    const res = await GET(makeRequest("http://localhost:3000/api/evaluations"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("evaluations");
    expect(Array.isArray(data.evaluations)).toBe(true);
  });
});

describe("POST /api/evaluations", () => {
  it("creates an evaluation and returns 201", async () => {
    const { POST } = await import("@/app/api/evaluations/route");
    mockPrisma.evaluation.create.mockResolvedValueOnce({
      id: "eval-1",
      title: "Test Eval",
      vendorId: "v1",
      status: "draft",
    });
    const body = {
      title: "Test Eval",
      vendorId: "v1",
      categoryId: "c1",
      dimensions: [{ key: "perf", name: "Performance", score: 8, weight: 1 }],
    };
    const res = await POST(makeRequest("http://localhost:3000/api/evaluations", "POST", body));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty("evaluation");
  });
});

// ─── /api/news ───────────────────────────────────────────────────

describe("GET /api/news", () => {
  it("returns news array with pagination info", async () => {
    const { GET } = await import("@/app/api/news/route");
    mockPrisma.newsItem.findMany.mockResolvedValueOnce([]);
    const res = await GET(makeRequest("http://localhost:3000/api/news"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("news");
    expect(Array.isArray(data.news)).toBe(true);
  });

  it("respects take parameter", async () => {
    const { GET } = await import("@/app/api/news/route");
    mockPrisma.newsItem.findMany.mockResolvedValueOnce([]);
    const res = await GET(makeRequest("http://localhost:3000/api/news?take=5"));
    expect(res.status).toBe(200);
  });
});

// ─── /api/dashboard ──────────────────────────────────────────────

describe("GET /api/dashboard", () => {
  it("returns stats, categories, news, and agent runs", async () => {
    const { GET } = await import("@/app/api/dashboard/route");

    // Setup mocks for the dashboard aggregation
    mockPrisma.vendor.count.mockResolvedValueOnce(10);
    mockPrisma.category.count.mockResolvedValueOnce(12);
    mockPrisma.benchmarkResult.count.mockResolvedValueOnce(50);
    mockPrisma.vendorScore.findMany.mockResolvedValueOnce([]);
    mockPrisma.evaluation.count.mockResolvedValueOnce(5);
    mockPrisma.newsItem.count.mockResolvedValueOnce(30);
    mockPrisma.category.findMany.mockResolvedValueOnce([]);
    mockPrisma.newsItem.findMany.mockResolvedValueOnce([]);
    mockPrisma.agentRun.findMany.mockResolvedValueOnce([]);

    const res = await GET(makeRequest("http://localhost:3000/api/dashboard"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("stats");
    expect(data).toHaveProperty("categories");
    expect(data).toHaveProperty("news");
    expect(data).toHaveProperty("agentRuns");
  });
});

// ─── /api/search ─────────────────────────────────────────────────

describe("GET /api/search", () => {
  it("returns empty results when q param is too short", async () => {
    const { GET } = await import("@/app/api/search/route");
    const res = await GET(makeRequest("http://localhost:3000/api/search?q=a"));
    const data = await res.json();
    expect(res.status).toBe(200);
    // Returns empty arrays for short queries
    expect(data.vendors).toHaveLength(0);
    expect(data.products).toHaveLength(0);
    expect(data.news).toHaveLength(0);
    expect(data.categories).toHaveLength(0);
  });

  it("returns grouped search results", async () => {
    const { GET } = await import("@/app/api/search/route");
    mockPrisma.vendor.findMany.mockResolvedValueOnce([]);
    mockPrisma.product.findMany.mockResolvedValueOnce([]);
    mockPrisma.newsItem.findMany.mockResolvedValueOnce([]);
    mockPrisma.category.findMany.mockResolvedValueOnce([]);

    const res = await GET(makeRequest("http://localhost:3000/api/search?q=snowflake"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("vendors");
    expect(data).toHaveProperty("products");
    expect(data).toHaveProperty("news");
    expect(data).toHaveProperty("categories");
  });
});

// ─── /api/vendors/compare ────────────────────────────────────────

describe("GET /api/vendors/compare", () => {
  it("returns 400 when ids param is missing", async () => {
    const { GET } = await import("@/app/api/vendors/compare/route");
    const res = await GET(makeRequest("http://localhost:3000/api/vendors/compare"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when fewer than 2 ids provided", async () => {
    const { GET } = await import("@/app/api/vendors/compare/route");
    const res = await GET(makeRequest("http://localhost:3000/api/vendors/compare?ids=v1"));
    expect(res.status).toBe(400);
  });

  it("returns vendors comparison data for valid ids", async () => {
    const { GET } = await import("@/app/api/vendors/compare/route");

    // The compare route uses Prisma include (scores, benchmarks, products with capabilities)
    const mockVendors = [
      {
        id: "v1",
        name: "Vendor A",
        slug: "vendor-a",
        description: null,
        website: null,
        tier: "leader",
        founded: 2015,
        hqLocation: "NYC",
        employeeRange: "100-500",
        overallScore: 85,
        categories: [{ isPrimary: true, categoryScore: 90, categoryRank: 1, category: { name: "DW", slug: "dw" } }],
        products: [{ name: "Product A", pricingModel: "usage-based", pricingUrl: null, tier: "enterprise", capabilities: [] }],
        scores: [{ score: 9, confidence: 1, criterion: { name: "Performance", key: "perf", weight: 2, categoryId: "c1" } }],
        benchmarks: [{ value: 120, benchmark: { name: "TPC-DS", unit: "s", higherIsBetter: false } }],
      },
      {
        id: "v2",
        name: "Vendor B",
        slug: "vendor-b",
        description: null,
        website: null,
        tier: "challenger",
        founded: 2018,
        hqLocation: "SF",
        employeeRange: "50-100",
        overallScore: 72,
        categories: [],
        products: [],
        scores: [],
        benchmarks: [],
      },
    ];
    mockPrisma.vendor.findMany.mockResolvedValueOnce(mockVendors);

    const res = await GET(makeRequest("http://localhost:3000/api/vendors/compare?ids=v1,v2"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("vendors");
    expect(Array.isArray(data.vendors)).toBe(true);
    expect(data.vendors).toHaveLength(2);
  });
});

// ─── /api/assistant ──────────────────────────────────────────────

describe("POST /api/assistant", () => {
  it("returns a reply", async () => {
    const { POST } = await import("@/app/api/assistant/route");
    const body = { message: "What is the best data platform?" };
    const res = await POST(makeRequest("http://localhost:3000/api/assistant", "POST", body));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("reply");
  });
});

// ─── /api/agents/vendor-scout/trigger ────────────────────────────

describe("POST /api/agents/vendor-scout/trigger", () => {
  it("returns scout results", async () => {
    const { POST } = await import("@/app/api/agents/vendor-scout/trigger/route");
    const res = await POST(makeRequest("http://localhost:3000/api/agents/vendor-scout/trigger", "POST"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("runId");
    expect(data).toHaveProperty("categoriesScanned");
    expect(data).toHaveProperty("durationMs");
  });
});

// ─── /api/agents/news-collector/trigger ──────────────────────────

describe("POST /api/agents/news-collector/trigger", () => {
  it("returns collection results", async () => {
    const { POST } = await import("@/app/api/agents/news-collector/trigger/route");
    const res = await POST(makeRequest("http://localhost:3000/api/agents/news-collector/trigger", "POST"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("runId");
    expect(data).toHaveProperty("collected");
    expect(data).toHaveProperty("durationMs");
  });
});

// ─── /api/agents/refresh-all (SSE) ──────────────────────────────

describe("POST /api/agents/refresh-all", () => {
  it("returns a streaming response with SSE headers", async () => {
    const { POST } = await import("@/app/api/agents/refresh-all/route");
    const res = await POST(makeRequest("http://localhost:3000/api/agents/refresh-all", "POST"));
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
    expect(res.headers.get("Connection")).toBe("keep-alive");
    expect(res.body).toBeTruthy();
  });
});

// ─── /api/assistant/chat (SSE) ───────────────────────────────────

describe("POST /api/assistant/chat", () => {
  it("returns a streaming response", async () => {
    const { POST } = await import("@/app/api/assistant/chat/route");
    const body = {
      messages: [{ role: "user", content: "Hello" }],
    };
    const res = await POST(makeRequest("http://localhost:3000/api/assistant/chat", "POST", body));
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.body).toBeTruthy();
  });
});
