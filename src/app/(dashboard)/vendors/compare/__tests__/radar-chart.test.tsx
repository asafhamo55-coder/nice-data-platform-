import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompareView } from "../compare-view";

// ─── Mocks ───────────────────────────────────────────────────────

const mockPush = vi.fn();
let mockIds = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({
    get: (key: string) => key === "ids" ? mockIds : null,
  }),
  usePathname: () => "/vendors/compare",
}));

// Mock fetch for compare data
const mockVendors = [
  {
    id: "v1",
    name: "Snowflake",
    slug: "snowflake",
    description: "Cloud data warehouse",
    website: "https://snowflake.com",
    tier: "leader",
    founded: 2012,
    hqLocation: "San Mateo, CA",
    employeeRange: "5000+",
    overallScore: 87,
    categories: [{ name: "Data Warehouse", slug: "dw", isPrimary: true, score: 90, rank: 1 }],
    products: [{ name: "Snowflake DW", pricingModel: "usage-based", pricingUrl: null, tier: "enterprise" }],
    radarDimensions: [
      { name: "Performance", value: 8 },
      { name: "Scalability", value: 9 },
      { name: "Cost", value: 6 },
      { name: "Support", value: 7 },
      { name: "Integration", value: 8 },
    ],
    capabilities: [
      { name: "SQL Support", maturity: "ga", rating: 9, product: "Snowflake DW" },
      { name: "Streaming", maturity: "preview", rating: 6, product: "Snowflake DW" },
    ],
    benchmarks: [
      { name: "TPC-DS 1TB", value: 120, unit: "seconds", higherIsBetter: false },
    ],
  },
  {
    id: "v2",
    name: "Databricks",
    slug: "databricks",
    description: "Lakehouse platform",
    website: "https://databricks.com",
    tier: "leader",
    founded: 2013,
    hqLocation: "San Francisco, CA",
    employeeRange: "5000+",
    overallScore: 85,
    categories: [{ name: "Data Warehouse", slug: "dw", isPrimary: true, score: 85, rank: 2 }],
    products: [{ name: "Databricks SQL", pricingModel: "credit-based", pricingUrl: null, tier: "enterprise" }],
    radarDimensions: [
      { name: "Performance", value: 9 },
      { name: "Scalability", value: 9 },
      { name: "Cost", value: 5 },
      { name: "Support", value: 7 },
      { name: "Integration", value: 7 },
    ],
    capabilities: [
      { name: "SQL Support", maturity: "ga", rating: 8, product: "Databricks SQL" },
      { name: "ML Integration", maturity: "ga", rating: 9, product: "Databricks SQL" },
    ],
    benchmarks: [
      { name: "TPC-DS 1TB", value: 110, unit: "seconds", higherIsBetter: false },
    ],
  },
];

describe("CompareView", () => {
  it("shows empty state when fewer than 2 vendor ids", () => {
    mockIds = "";
    render(<CompareView />);
    expect(screen.getByText("Select 2-4 vendors from the Vendor Hub to compare.")).toBeInTheDocument();
  });

  it("renders loading skeleton initially when ids are provided", () => {
    mockIds = "v1,v2";

    // Mock fetch to never resolve (stay in loading)
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}));

    const { container } = render(<CompareView />);
    const pulsingElements = container.querySelectorAll(".animate-pulse");
    expect(pulsingElements.length).toBeGreaterThan(0);

    vi.restoreAllMocks();
    mockIds = "";
  });

  it("renders back link to vendor hub", () => {
    mockIds = "";
    render(<CompareView />);
    const backLink = screen.getByText("Back to Vendor Hub");
    expect(backLink).toHaveAttribute("href", "/vendors");
  });

  it("fetches data when ids are provided", async () => {
    mockIds = "v1,v2";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ vendors: mockVendors }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(<CompareView />);

    // Verify fetch was called with correct URL
    expect(fetchSpy).toHaveBeenCalledWith("/api/vendors/compare?ids=v1,v2");

    vi.restoreAllMocks();
    mockIds = "";
  });
});
