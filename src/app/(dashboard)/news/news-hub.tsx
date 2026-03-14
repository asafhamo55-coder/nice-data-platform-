"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Newspaper,
  RefreshCw,
  Search,
  X,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Share2,
  ChevronDown,
  Star,
  Calendar,
  SlidersHorizontal,
  Sparkles,
  Loader2,
  Globe,
  Rss,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────

export interface NewsItemData {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  source: string | null;
  sourceIcon: string | null;
  imageUrl: string | null;
  newsCategory: string;
  sentiment: string | null;
  relevance: number;
  bookmarked: boolean;
  publishedAt: string;
  tags: string[];
  vendorId: string | null;
  vendorName: string | null;
  vendorSlug: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface NewsHubProps {
  initialItems: NewsItemData[];
  categories: CategoryOption[];
}

// ─── Constants ──────────────────────────────────────────────────

const NEWS_CATEGORIES: { key: string; label: string; color: string; bg: string }[] = [
  { key: "product_launch", label: "Product Launch", color: "text-blue-700", bg: "bg-blue-50" },
  { key: "funding", label: "Funding", color: "text-emerald-700", bg: "bg-emerald-50" },
  { key: "partnership", label: "Partnership", color: "text-purple-700", bg: "bg-purple-50" },
  { key: "acquisition", label: "Acquisition", color: "text-rose-700", bg: "bg-rose-50" },
  { key: "industry_report", label: "Industry Report", color: "text-amber-700", bg: "bg-amber-50" },
  { key: "regulation", label: "Regulation", color: "text-red-700", bg: "bg-red-50" },
  { key: "open_source", label: "Open Source", color: "text-green-700", bg: "bg-green-50" },
  { key: "benchmark", label: "Benchmark", color: "text-cyan-700", bg: "bg-cyan-50" },
  { key: "migration", label: "Migration", color: "text-orange-700", bg: "bg-orange-50" },
  { key: "general", label: "General", color: "text-navy-500", bg: "bg-navy-50" },
];

const CATEGORY_MAP = new Map(NEWS_CATEGORIES.map((c) => [c.key, c]));

// ─── Main Component ─────────────────────────────────────────────

export function NewsHub({ initialItems, categories }: NewsHubProps) {
  const [items, setItems] = useState<NewsItemData[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= 20);
  const [cursor, setCursor] = useState<string | null>(
    initialItems.length > 0 ? initialItems[initialItems.length - 1].id : null
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string | null>(null);
  const [selectedPlatformCategory, setSelectedPlatformCategory] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minRelevance, setMinRelevance] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ─── Collect News ──────────────────────────────────────────────

  const handleCollect = async () => {
    setCollecting(true);
    const toastId = toast.loading("Collecting latest news...");
    try {
      const res = await fetch("/api/agents/news-collector/trigger", { method: "POST" });
      if (!res.ok) throw new Error("Collection failed");
      const data = await res.json();

      toast.success(`Found ${data.collected} new items (${data.duplicatesSkipped} duplicates skipped)`, { id: toastId });

      // Reload items from API
      const reload = await fetch("/api/news?take=20");
      if (reload.ok) {
        const fresh = await reload.json();
        setItems(fresh.news.map(mapApiItem));
        setHasMore(fresh.hasMore);
        setCursor(fresh.nextCursor);
      }
    } catch {
      toast.error("Failed to collect news. Try again.", { id: toastId });
    } finally {
      setCollecting(false);
    }
  };

  // ─── Infinite Scroll ──────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ cursor, take: "20" });
      if (selectedNewsCategory) params.set("newsCategory", selectedNewsCategory);
      if (selectedPlatformCategory) params.set("categoryId", selectedPlatformCategory);
      if (minRelevance > 1) params.set("minRelevance", String(minRelevance));
      if (searchQuery) params.set("q", searchQuery);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const mapped: NewsItemData[] = data.news.map(mapApiItem);
      setItems((prev) => [...prev, ...mapped]);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch {
      toast.error("Failed to load more news");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor, selectedNewsCategory, selectedPlatformCategory, minRelevance, searchQuery, dateFrom, dateTo]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // ─── Bookmark Toggle ─────────────────────────────────────────

  const toggleBookmark = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newVal = !item.bookmarked;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, bookmarked: newVal } : i)));
    try {
      await fetch("/api/news", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, bookmarked: newVal }),
      });
    } catch {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, bookmarked: !newVal } : i)));
    }
  };

  // ─── Supabase Realtime ────────────────────────────────────────

  useEffect(() => {
    // Supabase realtime subscription for live updates.
    // Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    // Supabase Realtime via WebSocket for live news updates.
    // Uses dynamic script injection to avoid compile-time dependency.
    // Falls back gracefully if Supabase is not configured.
    let removed = false;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
    script.async = true;
    script.onload = () => {
      if (removed) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { createClient } = (window as any).supabase;
        const client = createClient(supabaseUrl, supabaseKey);
        const channel = client
          .channel("news_items_changes")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "news_items" },
            (payload: { new: Record<string, unknown> }) => {
              const row = payload.new;
              const newItem: NewsItemData = {
                id: row.id as string,
                title: row.title as string,
                summary: (row.summary as string) ?? null,
                url: row.url as string,
                source: (row.source as string) ?? null,
                sourceIcon: (row.source_icon as string) ?? null,
                imageUrl: (row.image_url as string) ?? null,
                newsCategory: (row.news_category as string) ?? "general",
                sentiment: (row.sentiment as string) ?? null,
                relevance: (row.relevance as number) ?? 5,
                bookmarked: (row.bookmarked as boolean) ?? false,
                publishedAt: row.published_at as string,
                tags: (row.tags as string[]) ?? [],
                vendorId: (row.vendor_id as string) ?? null,
                vendorName: null,
                vendorSlug: null,
                categoryId: (row.category_id as string) ?? null,
                categoryName: null,
                categoryColor: null,
              };
              setItems((prev) => [newItem, ...prev]);
              toast.info(`New: ${newItem.title.slice(0, 60)}…`);
            }
          )
          .subscribe();

        // Store cleanup ref
        script.dataset.channelCleanup = "true";
        script.addEventListener("cleanup", () => client.removeChannel(channel));
      } catch {
        // Supabase realtime init failed — silent
      }
    };
    document.head.appendChild(script);

    return () => {
      removed = true;
      if (script.dataset.channelCleanup) {
        script.dispatchEvent(new Event("cleanup"));
      }
      script.remove();
    };
  }, []);

  // ─── Client-Side Filtering ───────────────────────────────────

  const filtered = useMemo(() => {
    let result = items;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.summary?.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)) ||
          i.vendorName?.toLowerCase().includes(q)
      );
    }
    if (selectedNewsCategory) {
      result = result.filter((i) => i.newsCategory === selectedNewsCategory);
    }
    if (selectedPlatformCategory) {
      result = result.filter((i) => i.categoryId === selectedPlatformCategory);
    }
    if (minRelevance > 1) {
      result = result.filter((i) => i.relevance >= minRelevance);
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter((i) => new Date(i.publishedAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400_000;
      result = result.filter((i) => new Date(i.publishedAt).getTime() <= to);
    }
    return result;
  }, [items, searchQuery, selectedNewsCategory, selectedPlatformCategory, minRelevance, dateFrom, dateTo]);

  // Split featured vs regular
  const featured = filtered.filter((i) => i.relevance >= 8);
  const regular = filtered;

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; items: NewsItemData[] }[] = [];
    const buckets = new Map<string, NewsItemData[]>();

    for (const item of regular) {
      const key = formatDateGroup(item.publishedAt);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(item);
    }

    for (const [label, items] of buckets) {
      groups.push({ label, items });
    }

    return groups;
  }, [regular]);

  const hasActiveFilters = selectedNewsCategory || selectedPlatformCategory || minRelevance > 1 || dateFrom || dateTo || searchQuery;

  const clearFilters = () => {
    setSelectedNewsCategory(null);
    setSelectedPlatformCategory(null);
    setMinRelevance(1);
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
  };

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">News Feed</h1>
          <p className="mt-1 text-navy-400">
            Latest data platform industry news and vendor updates
            {items.length > 0 && (
              <span className="ml-2 text-xs text-navy-300">({items.length} items)</span>
            )}
          </p>
        </div>
        <button
          onClick={handleCollect}
          disabled={collecting}
          className="nav-transition inline-flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {collecting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          Collect Latest News
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news..."
              className="w-full rounded-lg border border-navy-100 bg-navy-50/40 py-2 pl-9 pr-8 text-sm text-navy placeholder:text-navy-300 focus:border-blue focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Platform category dropdown */}
          <div className="relative" ref={catDropdownRef}>
            <button
              onClick={() => setCatDropdownOpen(!catDropdownOpen)}
              className={cn(
                "nav-transition inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium",
                selectedPlatformCategory
                  ? "border-blue bg-blue-50 text-blue"
                  : "border-navy-100 text-navy-500 hover:border-navy-200"
              )}
            >
              <Globe size={12} />
              {selectedPlatformCategory
                ? categories.find((c) => c.id === selectedPlatformCategory)?.name ?? "Category"
                : "Platform Category"}
              <ChevronDown size={12} />
            </button>
            {catDropdownOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-xl border border-navy-100 bg-white p-1 shadow-lg">
                <button
                  onClick={() => { setSelectedPlatformCategory(null); setCatDropdownOpen(false); }}
                  className={cn("w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-navy-50", !selectedPlatformCategory && "font-medium text-blue")}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedPlatformCategory(cat.id); setCatDropdownOpen(false); }}
                    className={cn("w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-navy-50", selectedPlatformCategory === cat.id && "font-medium text-blue")}
                  >
                    <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: cat.color ?? "#5476a9" }} />
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle advanced filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "nav-transition inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium",
              showFilters ? "border-blue bg-blue-50 text-blue" : "border-navy-100 text-navy-500 hover:border-navy-200"
            )}
          >
            <SlidersHorizontal size={12} />
            Filters
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-navy-400 hover:text-navy"
            >
              <X size={10} />
              Clear all
            </button>
          )}
        </div>

        {/* News category pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedNewsCategory(null)}
            className={cn(
              "nav-transition rounded-full px-3 py-1 text-[11px] font-medium",
              !selectedNewsCategory
                ? "bg-navy text-white"
                : "bg-navy-50 text-navy-400 hover:bg-navy-100"
            )}
          >
            All
          </button>
          {NEWS_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedNewsCategory(selectedNewsCategory === cat.key ? null : cat.key)}
              className={cn(
                "nav-transition rounded-full px-3 py-1 text-[11px] font-medium",
                selectedNewsCategory === cat.key
                  ? cn(cat.bg, cat.color, "ring-1 ring-current/20")
                  : "bg-navy-50 text-navy-400 hover:bg-navy-100"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="mt-4 grid gap-4 border-t border-navy-50 pt-4 sm:grid-cols-3">
            {/* Date range */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                <Calendar size={10} className="mr-1 inline" />
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-navy-100 bg-navy-50/40 px-3 py-1.5 text-xs text-navy focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                <Calendar size={10} className="mr-1 inline" />
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-navy-100 bg-navy-50/40 px-3 py-1.5 text-xs text-navy focus:border-blue focus:outline-none"
              />
            </div>
            {/* Relevance slider */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                <Star size={10} className="mr-1 inline" />
                Min Relevance: {minRelevance}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={minRelevance}
                onChange={(e) => setMinRelevance(Number(e.target.value))}
                className="w-full accent-blue"
              />
              <div className="flex justify-between text-[9px] text-navy-300">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Featured Section */}
      {featured.length > 0 && !selectedNewsCategory && minRelevance < 8 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-navy">Featured Stories</h2>
            <span className="text-[10px] text-navy-300">Relevance ≥ 8</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 3).map((item) => (
              <FeaturedCard
                key={item.id}
                item={item}
                onToggleBookmark={toggleBookmark}
              />
            ))}
          </div>
        </div>
      )}

      {/* News Feed */}
      {grouped.length === 0 && !loading ? (
        <div className="rounded-xl border border-navy-100 bg-white p-12 text-center shadow-sm">
          <Newspaper className="mx-auto h-12 w-12 text-navy-200" />
          <h3 className="mt-4 font-semibold text-navy">No News Items</h3>
          <p className="mt-2 text-sm text-navy-400">
            {hasActiveFilters
              ? "No items match your filters. Try adjusting or clearing them."
              : "Click \"Collect Latest News\" to fetch articles from sources."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-navy-100" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-300">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-navy-100" />
              </div>
              <div className="space-y-4">
                {group.items.map((item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    onToggleBookmark={toggleBookmark}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={20} className="animate-spin text-navy-300" />
          <span className="ml-2 text-xs text-navy-400">Loading more…</span>
        </div>
      )}
      {!hasMore && items.length > 0 && (
        <p className="py-4 text-center text-xs text-navy-300">
          You&apos;ve reached the end of the feed.
        </p>
      )}
    </div>
  );
}

// ─── Featured Card ──────────────────────────────────────────────

function FeaturedCard({
  item,
  onToggleBookmark,
}: {
  item: NewsItemData;
  onToggleBookmark: (id: string) => void;
}) {
  const catConfig = CATEGORY_MAP.get(item.newsCategory);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/40 to-white p-5 shadow-sm hover:shadow-md nav-transition">
      <div className="absolute right-3 top-3 flex items-center gap-1">
        <RelevanceDots relevance={item.relevance} />
      </div>
      <div className="mb-3 flex items-center gap-2">
        {catConfig && (
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", catConfig.bg, catConfig.color)}>
            {catConfig.label}
          </span>
        )}
        {item.categoryName && (
          <span
            className="rounded-md px-1.5 py-0.5 text-[9px] font-medium text-white"
            style={{ backgroundColor: item.categoryColor ?? "#5476a9" }}
          >
            {item.categoryName}
          </span>
        )}
      </div>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-2 block text-base font-bold text-navy hover:text-blue nav-transition line-clamp-2"
      >
        {item.title}
      </a>
      {item.summary && (
        <p className="mb-3 text-xs leading-relaxed text-navy-400 line-clamp-2">{item.summary}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SourceBadge source={item.source} icon={item.sourceIcon} />
          <span className="text-[10px] text-navy-300">{relativeTime(item.publishedAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleBookmark(item.id)}
            className="nav-transition rounded-md p-1 text-navy-300 hover:text-amber-500"
          >
            {item.bookmarked ? <BookmarkCheck size={14} className="text-amber-500" /> : <Bookmark size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── News Card ──────────────────────────────────────────────────

function NewsCard({
  item,
  onToggleBookmark,
}: {
  item: NewsItemData;
  onToggleBookmark: (id: string) => void;
}) {
  const catConfig = CATEGORY_MAP.get(item.newsCategory);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url: item.url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(item.url);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="group rounded-xl border border-navy-100 bg-white p-5 shadow-sm hover:shadow-md nav-transition">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {/* Top row: badges + relevance */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {catConfig && (
              <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-medium", catConfig.bg, catConfig.color)}>
                {catConfig.label}
              </span>
            )}
            {item.categoryName && (
              <span
                className="rounded-md px-1.5 py-0.5 text-[9px] font-medium text-white"
                style={{ backgroundColor: item.categoryColor ?? "#5476a9" }}
              >
                {item.categoryName}
              </span>
            )}
            {item.vendorName && (
              <Link
                href={`/vendors/${item.vendorSlug}`}
                className="rounded-md bg-navy-50 px-1.5 py-0.5 text-[9px] font-medium text-navy-500 hover:text-blue nav-transition"
              >
                {item.vendorName}
              </Link>
            )}
            <span className="ml-auto flex items-center gap-1">
              <RelevanceDots relevance={item.relevance} />
            </span>
          </div>

          {/* Title */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-1.5 block text-base font-bold text-navy hover:text-blue nav-transition leading-snug"
          >
            {item.title}
            <ExternalLink size={11} className="ml-1 inline opacity-0 group-hover:opacity-50 nav-transition" />
          </a>

          {/* Summary */}
          {item.summary && (
            <p className="mb-3 text-sm leading-relaxed text-navy-400 line-clamp-3">{item.summary}</p>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-navy-50 px-2 py-0.5 text-[9px] font-medium text-navy-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer: source + date + actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SourceBadge source={item.source} icon={item.sourceIcon} />
              <span className="text-[10px] text-navy-300">{relativeTime(item.publishedAt)}</span>
              {item.sentiment && (
                <span className={cn(
                  "text-[9px] font-medium",
                  item.sentiment === "positive" ? "text-emerald-500" :
                  item.sentiment === "negative" ? "text-red-400" : "text-navy-300"
                )}>
                  {item.sentiment === "positive" ? "▲" : item.sentiment === "negative" ? "▼" : "●"} {item.sentiment}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onToggleBookmark(item.id)}
                className="nav-transition rounded-md p-1.5 text-navy-300 hover:bg-navy-50 hover:text-amber-500"
                title={item.bookmarked ? "Remove bookmark" : "Bookmark"}
              >
                {item.bookmarked ? <BookmarkCheck size={14} className="text-amber-500" /> : <Bookmark size={14} />}
              </button>
              <button
                onClick={handleShare}
                className="nav-transition rounded-md p-1.5 text-navy-300 hover:bg-navy-50 hover:text-blue"
                title="Share"
              >
                <Share2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────

function SourceBadge({ source, icon }: { source: string | null; icon: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-navy-400">
      {icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" className="h-3.5 w-3.5 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      ) : (
        <Rss size={10} className="text-navy-300" />
      )}
      {source ?? "Unknown source"}
    </span>
  );
}

function RelevanceDots({ relevance }: { relevance: number }) {
  const filled = Math.round(relevance);
  return (
    <span className="inline-flex items-center gap-0.5" title={`Relevance: ${relevance}/10`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i < filled
              ? relevance >= 8 ? "bg-emerald-400"
                : relevance >= 5 ? "bg-blue"
                  : "bg-navy-200"
              : "bg-navy-100"
          )}
        />
      ))}
      <span className="ml-1 text-[9px] font-medium text-navy-300">{relevance}</span>
    </span>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateGroup(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function mapApiItem(n: Record<string, unknown>): NewsItemData {
  return {
    id: n.id as string,
    title: n.title as string,
    summary: (n.summary as string) ?? null,
    url: n.url as string,
    source: (n.source as string) ?? null,
    sourceIcon: (n.sourceIcon as string) ?? null,
    imageUrl: (n.imageUrl as string) ?? null,
    newsCategory: (n.newsCategory as string) ?? "general",
    sentiment: (n.sentiment as string) ?? null,
    relevance: (n.relevance as number) ?? 5,
    bookmarked: (n.bookmarked as boolean) ?? false,
    publishedAt: typeof n.publishedAt === "string" ? n.publishedAt : (n.publishedAt as Date)?.toISOString?.() ?? new Date().toISOString(),
    tags: (n.tags as string[]) ?? [],
    vendorId: (n.vendorId as string) ?? null,
    vendorName: ((n.vendor as Record<string, string>)?.name as string) ?? null,
    vendorSlug: ((n.vendor as Record<string, string>)?.slug as string) ?? null,
    categoryId: (n.categoryId as string) ?? null,
    categoryName: ((n.category as Record<string, string>)?.name as string) ?? null,
    categoryColor: ((n.category as Record<string, string>)?.color as string) ?? null,
  };
}
