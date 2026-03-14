/**
 * E2E Test: Vendor Browse → Detail → Comparison Flow
 *
 * Simulates the full user journey:
 * 1. Browse vendor list
 * 2. Select vendors for comparison
 * 3. Navigate to comparison page
 * 4. View comparison results (radar chart, feature matrix, benchmarks)
 *
 * Since we don't have a real browser, these tests verify the flow
 * at the API/logic level, simulating what the UI would do.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ─────────────────────────────────────────────────

const mockVendors = [
  {
    id: "v1",
    name: "Snowflake",
    slug: "snowflake",
    description: "Cloud data warehouse",
    website: "https://snowflake.com",
    tier: "leader",
    type: "commercial",
    founded: 2012,
    hqLocation: "San Mateo",
    employeeRange: "5000+",
    overallScore: 87,
    overallRank: 1,
    vendorCategories: [
      {
        isPrimary: true,
        categoryScore: 90,
        categoryRank: 1,
        category: { id: "c1", name: "Data Warehouse", slug: "dw", color: "#2E75B6" },
      },
    ],
    products: [
      { name: "Snowflake DW", pricingModel: "usage-based", pricingUrl: null, tier: "enterprise" },
    ],
    _count: { products: 2, vendorCategories: 3 },
  },
  {
    id: "v2",
    name: "Databricks",
    slug: "databricks",
    description: "Lakehouse platform",
    website: "https://databricks.com",
    tier: "leader",
    type: "open-core",
    founded: 2013,
    hqLocation: "San Francisco",
    employeeRange: "5000+",
    overallScore: 85,
    overallRank: 2,
    vendorCategories: [
      {
        isPrimary: true,
        categoryScore: 85,
        categoryRank: 2,
        category: { id: "c1", name: "Data Warehouse", slug: "dw", color: "#2E75B6" },
      },
    ],
    products: [
      { name: "Databricks SQL", pricingModel: "credit-based", pricingUrl: null, tier: "enterprise" },
    ],
    _count: { products: 3, vendorCategories: 2 },
  },
  {
    id: "v3",
    name: "Apache Spark",
    slug: "apache-spark",
    description: "Open source analytics engine",
    website: "https://spark.apache.org",
    tier: "emerging",
    type: "open-source",
    founded: 2010,
    hqLocation: null,
    employeeRange: null,
    overallScore: 72,
    overallRank: 5,
    vendorCategories: [],
    products: [],
    _count: { products: 0, vendorCategories: 1 },
  },
];

const mockPrisma = {
  vendor: {
    findMany: vi.fn().mockResolvedValue(mockVendors),
    count: vi.fn().mockResolvedValue(3),
  },
  category: {
    findMany: vi.fn().mockResolvedValue([
      { id: "c1", name: "Data Warehouse", slug: "dw", color: "#2E75B6", _count: { vendorCategories: 10 } },
    ]),
  },
  vendorScore: {
    findMany: vi.fn().mockResolvedValue([
      {
        vendorId: "v1",
        score: 9,
        confidence: 1,
        criterion: { id: "cr1", key: "performance", name: "Performance", weight: 2 },
      },
      {
        vendorId: "v2",
        score: 8,
        confidence: 0.9,
        criterion: { id: "cr1", key: "performance", name: "Performance", weight: 2 },
      },
    ]),
  },
  capability: {
    findMany: vi.fn().mockResolvedValue([
      { name: "SQL Support", maturity: "ga", rating: 9, product: { name: "Snowflake DW" } },
    ]),
  },
  benchmarkResult: {
    findMany: vi.fn().mockResolvedValue([
      {
        value: 120,
        benchmark: { name: "TPC-DS 1TB", unit: "seconds", higherIsBetter: false },
      },
    ]),
  },
  vendorCategory: { findMany: vi.fn().mockResolvedValue([]) },
  product: { findMany: vi.fn().mockResolvedValue([]) },
  criterion: { findMany: vi.fn().mockResolvedValue([]) },
  newsItem: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}));

vi.mock("@/lib/scoring/engine", async () => {
  const actual = await vi.importActual("@/lib/scoring/engine");
  return actual;
});

beforeEach(() => vi.clearAllMocks());

// ─── Helpers ─────────────────────────────────────────────────────

function makeRequest(url: string, method = "GET") {
  const { NextRequest } = require("next/server");
  return new NextRequest(new URL(url, "http://localhost:3000"), { method });
}

// ─── E2E Flow ────────────────────────────────────────────────────

describe("E2E: Vendor Browse → Compare Flow", () => {
  it("Step 1: Browse vendors via API", async () => {
    const { GET } = await import("@/app/api/vendors/route");
    const res = await GET(makeRequest("http://localhost:3000/api/vendors"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty("vendors");
    // Stub returns empty but we verify the endpoint works
  });

  it("Step 2: Search for a specific vendor", async () => {
    const { GET } = await import("@/app/api/search/route");

    // Search route uses Promise.all with 4 findMany calls
    // The search route accesses v.categories[0]?.category.name
    mockPrisma.vendor.findMany.mockResolvedValueOnce([
      {
        id: "v1",
        name: "Snowflake",
        slug: "snowflake",
        tier: "leader",
        overallScore: 87,
        categories: [{ isPrimary: true, category: { name: "Data Warehouse" } }],
      },
    ]);
    mockPrisma.product.findMany.mockResolvedValueOnce([]);
    mockPrisma.newsItem.findMany.mockResolvedValueOnce([]);
    mockPrisma.category.findMany.mockResolvedValueOnce([]);

    const res = await GET(makeRequest("http://localhost:3000/api/search?q=snowflake"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty("vendors");
  });

  it("Step 3: Compare two vendors via compare API", async () => {
    const { GET } = await import("@/app/api/vendors/compare/route");

    // The compare route uses Prisma include (scores, benchmarks, products with capabilities inline)
    mockPrisma.vendor.findMany.mockResolvedValueOnce([
      {
        id: "v1",
        name: "Snowflake",
        slug: "snowflake",
        description: "Cloud DW",
        website: "https://snowflake.com",
        tier: "leader",
        founded: 2012,
        hqLocation: "San Mateo",
        employeeRange: "5000+",
        overallScore: 87,
        categories: [
          { isPrimary: true, categoryScore: 90, categoryRank: 1, category: { name: "Data Warehouse", slug: "dw" } },
        ],
        products: [
          { name: "Snowflake DW", pricingModel: "usage-based", pricingUrl: null, tier: "enterprise", capabilities: [{ name: "SQL Support", maturity: "ga", rating: 9 }] },
        ],
        scores: [
          { score: 9, confidence: 1, criterion: { name: "Performance", key: "perf", weight: 2, categoryId: "c1" } },
          { score: 8, confidence: 1, criterion: { name: "Scalability", key: "scale", weight: 1.5, categoryId: "c1" } },
        ],
        benchmarks: [
          { value: 120, benchmark: { name: "TPC-DS 1TB", unit: "seconds", higherIsBetter: false } },
        ],
      },
      {
        id: "v2",
        name: "Databricks",
        slug: "databricks",
        description: "Lakehouse",
        website: "https://databricks.com",
        tier: "leader",
        founded: 2013,
        hqLocation: "SF",
        employeeRange: "5000+",
        overallScore: 85,
        categories: [
          { isPrimary: true, categoryScore: 85, categoryRank: 2, category: { name: "Data Warehouse", slug: "dw" } },
        ],
        products: [
          { name: "Databricks SQL", pricingModel: "credit-based", pricingUrl: null, tier: "enterprise", capabilities: [{ name: "SQL Support", maturity: "ga", rating: 8 }] },
        ],
        scores: [
          { score: 8, confidence: 0.9, criterion: { name: "Performance", key: "perf", weight: 2, categoryId: "c1" } },
          { score: 9, confidence: 1, criterion: { name: "Scalability", key: "scale", weight: 1.5, categoryId: "c1" } },
        ],
        benchmarks: [
          { value: 110, benchmark: { name: "TPC-DS 1TB", unit: "seconds", higherIsBetter: false } },
        ],
      },
    ]);

    const res = await GET(makeRequest("http://localhost:3000/api/vendors/compare?ids=v1,v2"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.vendors).toHaveLength(2);

    // Verify vendor data shape
    const [snowflake, databricks] = data.vendors;
    expect(snowflake.name).toBe("Snowflake");
    expect(databricks.name).toBe("Databricks");
    // overallScore is recalculated from criterion scores, not from the vendor record
    expect(snowflake.overallScore).toBeGreaterThan(0);
    expect(databricks.overallScore).toBeGreaterThan(0);

    // Verify radar dimensions exist
    expect(snowflake.radarDimensions).toBeDefined();
    expect(Array.isArray(snowflake.radarDimensions)).toBe(true);

    // Verify capabilities exist
    expect(snowflake.capabilities).toBeDefined();
    expect(databricks.capabilities).toBeDefined();

    // Verify benchmarks exist
    expect(snowflake.benchmarks).toBeDefined();
    expect(databricks.benchmarks).toBeDefined();
  });

  it("Step 4: Calculate pricing for compared vendors", async () => {
    const { POST } = await import("@/app/api/pricing/route");
    const body = {
      vendors: [
        { vendorId: "v1", vendorName: "Snowflake", vendorSlug: "snowflake", tier: "leader", pricingModel: "usage-based", category: "dw" },
        { vendorId: "v2", vendorName: "Databricks", vendorSlug: "databricks", tier: "leader", pricingModel: "credit-based", category: "dw" },
      ],
      profile: { key: "medium" },
    };
    const { NextRequest } = require("next/server");
    const req = new NextRequest(new URL("http://localhost:3000/api/pricing"), {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.estimates).toHaveLength(2);

    // Both should have valid pricing
    for (const estimate of data.estimates) {
      expect(estimate.monthly.total).toBeGreaterThan(0);
      expect(estimate.annual.total).toBeGreaterThan(0);
      expect(estimate.threeYear.total).toBeGreaterThan(0);
    }
  });
});
