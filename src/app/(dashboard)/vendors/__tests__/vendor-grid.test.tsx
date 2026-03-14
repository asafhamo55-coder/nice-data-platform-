import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VendorGrid } from "../vendor-grid";
import type { VendorData } from "../vendor-hub";

// Mock VendorInitials and ScoreGauge to simplify rendering
vi.mock("../vendor-hub", async () => {
  const actual = await vi.importActual("../vendor-hub");
  return {
    ...actual,
    VendorInitials: ({ name }: { name: string }) => (
      <span data-testid="vendor-initials">{name.slice(0, 2)}</span>
    ),
  };
});

vi.mock("../score-gauge", () => ({
  ScoreGauge: ({ score }: { score: number }) => (
    <span data-testid="score-gauge">{score}</span>
  ),
}));

// ─── Test data ───────────────────────────────────────────────────

function makeVendor(overrides: Partial<VendorData> = {}): VendorData {
  return {
    id: "v1",
    name: "Snowflake",
    slug: "snowflake",
    description: "Cloud data warehouse",
    website: "https://snowflake.com",
    logoUrl: null,
    tier: "leader",
    type: "commercial",
    founded: 2012,
    hqLocation: "San Mateo, CA",
    employeeRange: "5000+",
    overallScore: 87,
    pricingModel: "usage-based",
    primaryCategory: {
      id: "c1",
      name: "Data Warehouse",
      slug: "data-warehouse",
      color: "#2E75B6",
    },
    categoryCount: 3,
    productCount: 2,
    ...overrides,
  };
}

const vendors: VendorData[] = [
  makeVendor({ id: "v1", name: "Snowflake", overallScore: 87 }),
  makeVendor({ id: "v2", name: "Databricks", slug: "databricks", overallScore: 82, type: "open-core" }),
  makeVendor({ id: "v3", name: "Apache Spark", slug: "apache-spark", overallScore: 74, type: "open-source" }),
];

// ─── Tests ───────────────────────────────────────────────────────

describe("VendorGrid", () => {
  it("renders all vendor cards", () => {
    render(
      <VendorGrid
        vendors={vendors}
        compareIds={new Set()}
        onToggleCompare={vi.fn()}
      />
    );
    expect(screen.getByText("Snowflake")).toBeInTheDocument();
    expect(screen.getByText("Databricks")).toBeInTheDocument();
    expect(screen.getByText("Apache Spark")).toBeInTheDocument();
  });

  it("shows score gauge for each vendor", () => {
    render(
      <VendorGrid
        vendors={vendors}
        compareIds={new Set()}
        onToggleCompare={vi.fn()}
      />
    );
    const gauges = screen.getAllByTestId("score-gauge");
    expect(gauges).toHaveLength(3);
    expect(gauges[0]).toHaveTextContent("87");
    expect(gauges[1]).toHaveTextContent("82");
    expect(gauges[2]).toHaveTextContent("74");
  });

  it("shows correct type badges", () => {
    render(
      <VendorGrid
        vendors={vendors}
        compareIds={new Set()}
        onToggleCompare={vi.fn()}
      />
    );
    expect(screen.getByText("Commercial")).toBeInTheDocument();
    expect(screen.getByText("Open Core")).toBeInTheDocument();
    expect(screen.getByText("Open Source")).toBeInTheDocument();
  });

  it("shows product and category counts", () => {
    render(
      <VendorGrid
        vendors={[makeVendor({ productCount: 5, categoryCount: 3 })]}
        compareIds={new Set()}
        onToggleCompare={vi.fn()}
      />
    );
    expect(screen.getByText("5 products")).toBeInTheDocument();
    expect(screen.getByText("3 categories")).toBeInTheDocument();
  });

  it("shows singular form for count of 1", () => {
    render(
      <VendorGrid
        vendors={[makeVendor({ productCount: 1, categoryCount: 1 })]}
        compareIds={new Set()}
        onToggleCompare={vi.fn()}
      />
    );
    expect(screen.getByText("1 product")).toBeInTheDocument();
    expect(screen.getByText("1 category")).toBeInTheDocument();
  });

  it("shows primary category badge", () => {
    render(
      <VendorGrid
        vendors={[makeVendor()]}
        compareIds={new Set()}
        onToggleCompare={vi.fn()}
      />
    );
    expect(screen.getByText("Data Warehouse")).toBeInTheDocument();
  });

  it("renders view details link with correct href", () => {
    render(
      <VendorGrid
        vendors={[makeVendor({ slug: "snowflake" })]}
        compareIds={new Set()}
        onToggleCompare={vi.fn()}
      />
    );
    const link = screen.getByText("View details");
    expect(link).toHaveAttribute("href", "/vendors/snowflake");
  });

  it("renders website link when available", () => {
    render(
      <VendorGrid
        vendors={[makeVendor({ website: "https://example.com" })]}
        compareIds={new Set()}
        onToggleCompare={vi.fn()}
      />
    );
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    expect(externalLinks.length).toBe(1);
    expect(externalLinks[0]).toHaveAttribute("href", "https://example.com");
  });

  it("does not render website link when null", () => {
    render(
      <VendorGrid
        vendors={[makeVendor({ website: null })]}
        compareIds={new Set()}
        onToggleCompare={vi.fn()}
      />
    );
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    expect(externalLinks.length).toBe(0);
  });

  // ─── Compare functionality ──────────────────────────────────

  it("checkbox is unchecked when vendor is not in compareIds", () => {
    render(
      <VendorGrid
        vendors={[makeVendor()]}
        compareIds={new Set()}
        onToggleCompare={vi.fn()}
      />
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("checkbox is checked when vendor is in compareIds", () => {
    render(
      <VendorGrid
        vendors={[makeVendor({ id: "v1" })]}
        compareIds={new Set(["v1"])}
        onToggleCompare={vi.fn()}
      />
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("calls onToggleCompare with vendor id when checkbox clicked", () => {
    const onToggle = vi.fn();
    render(
      <VendorGrid
        vendors={[makeVendor({ id: "v1" })]}
        compareIds={new Set()}
        onToggleCompare={onToggle}
      />
    );
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith("v1");
  });

  it("applies highlight styling when vendor is being compared", () => {
    const { container } = render(
      <VendorGrid
        vendors={[makeVendor({ id: "v1" })]}
        compareIds={new Set(["v1"])}
        onToggleCompare={vi.fn()}
      />
    );
    const card = container.querySelector(".border-accent");
    expect(card).toBeTruthy();
  });

  // ─── Empty state ────────────────────────────────────────────

  it("renders nothing when vendors array is empty", () => {
    const { container } = render(
      <VendorGrid
        vendors={[]}
        compareIds={new Set()}
        onToggleCompare={vi.fn()}
      />
    );
    const grid = container.querySelector(".grid");
    expect(grid?.children.length).toBe(0);
  });
});
