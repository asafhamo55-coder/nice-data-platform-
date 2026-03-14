import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NewsHub, type NewsItemData } from "../news-hub";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn().mockReturnValue("toast-id"),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// ─── Test data ───────────────────────────────────────────────────

function makeNewsItem(overrides: Partial<NewsItemData> = {}): NewsItemData {
  return {
    id: "n1",
    title: "Snowflake Launches New Feature",
    summary: "Snowflake announced a major new capability for data sharing.",
    url: "https://example.com/news/1",
    source: "TechCrunch",
    sourceIcon: null,
    imageUrl: null,
    newsCategory: "product_launch",
    sentiment: "positive",
    relevance: 7,
    bookmarked: false,
    publishedAt: new Date().toISOString(),
    tags: ["snowflake", "data-sharing"],
    vendorId: "v1",
    vendorName: "Snowflake",
    vendorSlug: "snowflake",
    categoryId: "c1",
    categoryName: "Data Warehouse",
    categoryColor: "#2E75B6",
    ...overrides,
  };
}

const categories = [
  { id: "c1", name: "Data Warehouse", slug: "data-warehouse", color: "#2E75B6" },
  { id: "c2", name: "ETL/ELT", slug: "etl-elt", color: "#10b981" },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ news: [], hasMore: false, nextCursor: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );
});

// ─── Tests ───────────────────────────────────────────────────────

describe("NewsHub", () => {
  it("renders the heading and description", () => {
    render(<NewsHub initialItems={[]} categories={categories} />);
    expect(screen.getByText("News Feed")).toBeInTheDocument();
    expect(screen.getByText(/Latest data platform industry news/)).toBeInTheDocument();
  });

  it("shows empty state when no items", () => {
    render(<NewsHub initialItems={[]} categories={categories} />);
    expect(screen.getByText("No News Items")).toBeInTheDocument();
  });

  it("renders news items with title and summary", () => {
    const items = [
      makeNewsItem({ id: "n1", title: "Test Article", summary: "Test summary text" }),
    ];
    render(<NewsHub initialItems={items} categories={categories} />);
    expect(screen.getByText("Test Article")).toBeInTheDocument();
    expect(screen.getByText("Test summary text")).toBeInTheDocument();
  });

  it("renders news category badge", () => {
    const items = [makeNewsItem({ newsCategory: "funding" })];
    render(<NewsHub initialItems={items} categories={categories} />);
    // "Funding" appears in both the filter pill and the card badge
    const fundingElements = screen.getAllByText("Funding");
    expect(fundingElements.length).toBeGreaterThanOrEqual(2); // pill + badge
  });

  it("renders vendor name as link", () => {
    const items = [makeNewsItem({ vendorName: "Snowflake", vendorSlug: "snowflake" })];
    render(<NewsHub initialItems={items} categories={categories} />);
    const vendorLink = screen.getByText("Snowflake");
    expect(vendorLink).toHaveAttribute("href", "/vendors/snowflake");
  });

  it("renders tags", () => {
    const items = [makeNewsItem({ tags: ["ai", "ml"] })];
    render(<NewsHub initialItems={items} categories={categories} />);
    expect(screen.getByText("#ai")).toBeInTheDocument();
    expect(screen.getByText("#ml")).toBeInTheDocument();
  });

  it("shows item count in parentheses", () => {
    const items = [makeNewsItem(), makeNewsItem({ id: "n2", title: "Second Article" })];
    render(<NewsHub initialItems={items} categories={categories} />);
    expect(screen.getByText("(2 items)")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<NewsHub initialItems={[]} categories={categories} />);
    expect(screen.getByPlaceholderText("Search news...")).toBeInTheDocument();
  });

  it("filters items by search query", () => {
    const items = [
      makeNewsItem({ id: "n1", title: "Snowflake launches new feature", newsCategory: "product_launch", vendorName: "Snowflake", vendorSlug: "snowflake" }),
      makeNewsItem({ id: "n2", title: "BigQuery announces partnership", newsCategory: "partnership", vendorName: "Google", vendorSlug: "google", vendorId: "v2", tags: ["bigquery", "cloud"], summary: "Google Cloud BigQuery update" }),
    ];
    render(<NewsHub initialItems={items} categories={categories} />);
    const searchInput = screen.getByPlaceholderText("Search news...");
    fireEvent.change(searchInput, { target: { value: "Snowflake" } });

    // Snowflake item should still be visible (matched by title AND vendorName)
    expect(screen.getByText("Snowflake launches new feature")).toBeInTheDocument();
    // BigQuery title should be filtered out
    expect(screen.queryByText("BigQuery announces partnership")).not.toBeInTheDocument();
  });

  it("filters by news category when pill is clicked", () => {
    const items = [
      makeNewsItem({ id: "n1", title: "Funding News Title", newsCategory: "funding" }),
      makeNewsItem({ id: "n2", title: "Product Launch Title", newsCategory: "product_launch" }),
    ];
    render(<NewsHub initialItems={items} categories={categories} />);

    // Click "Funding" pill - there are two elements with "Funding" text (pill + badge from items),
    // so we need to find the filter pill specifically
    const fundingButtons = screen.getAllByText("Funding");
    // The pill button is the one in the filter bar
    const pillButton = fundingButtons.find(el => el.tagName === "BUTTON");
    fireEvent.click(pillButton!);

    expect(screen.getByText("Funding News Title")).toBeInTheDocument();
    expect(screen.queryByText("Product Launch Title")).not.toBeInTheDocument();
  });

  it("shows featured stories for relevance >= 8", () => {
    const items = [
      makeNewsItem({ id: "n1", title: "Featured Item", relevance: 9 }),
      makeNewsItem({ id: "n2", title: "Regular Item", relevance: 5 }),
    ];
    render(<NewsHub initialItems={items} categories={categories} />);
    expect(screen.getByText("Featured Stories")).toBeInTheDocument();
  });

  it("handles collect news button", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ collected: 5, duplicatesSkipped: 1 }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ news: [], hasMore: false, nextCursor: null }), { status: 200 })
      );

    render(<NewsHub initialItems={[]} categories={categories} />);
    const collectBtn = screen.getByText("Collect Latest News");
    fireEvent.click(collectBtn);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/agents/news-collector/trigger",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("shows sentiment indicator", () => {
    const items = [makeNewsItem({ sentiment: "positive" })];
    render(<NewsHub initialItems={items} categories={categories} />);
    expect(screen.getByText(/positive/)).toBeInTheDocument();
  });

  it("renders source name", () => {
    const items = [makeNewsItem({ source: "TechCrunch" })];
    render(<NewsHub initialItems={items} categories={categories} />);
    expect(screen.getByText("TechCrunch")).toBeInTheDocument();
  });
});
