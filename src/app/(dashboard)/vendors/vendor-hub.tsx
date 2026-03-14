"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutGrid,
  List,
  X,
  SlidersHorizontal,
  ChevronDown,
  GitCompareArrows,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VendorGrid } from "./vendor-grid";
import { VendorDataTable } from "./vendor-data-table";
import { ScoreSlider } from "./score-slider";

// ─── Types ───────────────────────────────────────────────────

export interface VendorData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  tier: string;
  type: "commercial" | "open-source" | "open-core";
  founded: number | null;
  hqLocation: string | null;
  employeeRange: string | null;
  overallScore: number;
  pricingModel: string;
  primaryCategory: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
  categoryCount: number;
  productCount: number;
}

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

type ViewMode = "grid" | "table";
type VendorType = "commercial" | "open-source" | "open-core";

const TYPE_CONFIG: Record<VendorType, { label: string; color: string; bg: string }> = {
  commercial: { label: "Commercial", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  "open-source": { label: "Open Source", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  "open-core": { label: "Open Core", color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
};

// ─── Main Component ──────────────────────────────────────────

export function VendorHub({
  vendors,
  categories,
}: {
  vendors: VendorData[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<VendorType>>(new Set());
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  // ─── Keyboard shortcut ⌘K ───────────────────────────────

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setAutocompleteOpen(false);
        setCatDropdownOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Close category dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ─── Filtering logic ────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return vendors.filter((v) => {
      if (q && !v.name.toLowerCase().includes(q) && !v.description?.toLowerCase().includes(q)) {
        return false;
      }
      if (selectedCategory && v.primaryCategory?.slug !== selectedCategory) {
        return false;
      }
      if (selectedTypes.size > 0 && !selectedTypes.has(v.type)) {
        return false;
      }
      if (v.overallScore < scoreRange[0] || v.overallScore > scoreRange[1]) {
        return false;
      }
      return true;
    });
  }, [vendors, search, selectedCategory, selectedTypes, scoreRange]);

  // ─── Autocomplete suggestions ───────────────────────────

  const suggestions = useMemo(() => {
    if (!search.trim() || search.trim().length < 1) return [];
    const q = search.toLowerCase().trim();
    return vendors
      .filter((v) => v.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [vendors, search]);

  // ─── Compare toggle ─────────────────────────────────────

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ─── Type pill toggle ───────────────────────────────────

  const toggleType = useCallback((type: VendorType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  // ─── Clear all filters ──────────────────────────────────

  const hasFilters = selectedCategory || selectedTypes.size > 0 || scoreRange[0] > 0 || scoreRange[1] < 100;

  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedTypes(new Set());
    setScoreRange([0, 100]);
    setSearch("");
  }, []);

  const selectedCategoryName = categories.find(c => c.slug === selectedCategory)?.name;

  return (
    <div className="space-y-5">
      {/* ─── Page Header ──────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy">
              Vendor Hub
            </h1>
            <p className="mt-0.5 text-sm text-navy-400">
              Browse and compare data platform vendors
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue">
            {vendors.length} vendors
          </span>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-navy-100 bg-white p-1">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "nav-transition flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
              view === "grid"
                ? "bg-navy text-white shadow-sm"
                : "text-navy-400 hover:text-navy"
            )}
          >
            <LayoutGrid size={14} />
            Grid
          </button>
          <button
            onClick={() => setView("table")}
            className={cn(
              "nav-transition flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
              view === "table"
                ? "bg-navy text-white shadow-sm"
                : "text-navy-400 hover:text-navy"
            )}
          >
            <List size={14} />
            Table
          </button>
        </div>
      </div>

      {/* ─── Search Bar ───────────────────────────────── */}
      <div className="relative">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300"
          />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setAutocompleteOpen(e.target.value.length > 0);
            }}
            onFocus={() => search.length > 0 && setAutocompleteOpen(true)}
            onBlur={() => setTimeout(() => setAutocompleteOpen(false), 200)}
            placeholder="Search vendors by name or description..."
            className="nav-transition w-full rounded-xl border border-navy-100 bg-white py-2.5 pl-10 pr-24 text-sm text-navy placeholder:text-navy-300 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
          />
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {search && (
              <button
                onClick={() => { setSearch(""); setAutocompleteOpen(false); }}
                className="rounded p-0.5 text-navy-300 hover:text-navy-500"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="hidden rounded border border-navy-200 bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-navy-400 sm:inline-block">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Autocomplete dropdown */}
        {autocompleteOpen && suggestions.length > 0 && (
          <div className="absolute z-30 mt-1 w-full rounded-xl border border-navy-100 bg-white py-1 shadow-lg">
            {suggestions.map((v) => (
              <button
                key={v.id}
                onMouseDown={() => {
                  setSearch(v.name);
                  setAutocompleteOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-navy-50"
              >
                <VendorInitials name={v.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-navy">{v.name}</span>
                  {v.primaryCategory && (
                    <span className="ml-2 text-xs text-navy-400">
                      {v.primaryCategory.name}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-blue">
                  {v.overallScore}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Filter Bar ───────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category dropdown */}
        <div ref={catRef} className="relative">
          <button
            onClick={() => setCatDropdownOpen(!catDropdownOpen)}
            className={cn(
              "nav-transition flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
              selectedCategory
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-navy-100 bg-white text-navy-500 hover:border-navy-200"
            )}
          >
            {selectedCategoryName ?? "All Categories"}
            <ChevronDown size={14} className={cn("nav-transition", catDropdownOpen && "rotate-180")} />
          </button>
          {catDropdownOpen && (
            <div className="absolute z-20 mt-1 w-56 rounded-xl border border-navy-100 bg-white py-1 shadow-lg">
              <button
                onClick={() => { setSelectedCategory(null); setCatDropdownOpen(false); }}
                className={cn(
                  "w-full px-3 py-2 text-left text-xs hover:bg-navy-50",
                  !selectedCategory ? "font-semibold text-blue" : "text-navy-500"
                )}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCategory(c.slug); setCatDropdownOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-navy-50",
                    selectedCategory === c.slug ? "font-semibold text-blue" : "text-navy-500"
                  )}
                >
                  {c.color && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                  )}
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type pills */}
        {(Object.entries(TYPE_CONFIG) as [VendorType, typeof TYPE_CONFIG[VendorType]][]).map(
          ([type, cfg]) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={cn(
                "nav-transition rounded-lg border px-3 py-2 text-xs font-medium",
                selectedTypes.has(type)
                  ? `${cfg.bg} ${cfg.color} border`
                  : "border-navy-100 bg-white text-navy-500 hover:border-navy-200"
              )}
            >
              {cfg.label}
            </button>
          )
        )}

        {/* Filter toggle for score slider */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "nav-transition flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium",
            showFilters
              ? "border-accent-200 bg-accent-50 text-accent-700"
              : "border-navy-100 bg-white text-navy-500 hover:border-navy-200"
          )}
        >
          <SlidersHorizontal size={13} />
          Score Range
        </button>

        {/* Active filter count + clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-navy-400 hover:text-danger"
          >
            <X size={13} />
            Clear filters
          </button>
        )}

        {/* Result count */}
        <span className="ml-auto text-xs text-navy-400">
          {filtered.length} of {vendors.length} vendors
        </span>
      </div>

      {/* Score range slider (expandable) */}
      {showFilters && (
        <div className="rounded-xl border border-navy-100 bg-white px-5 py-4">
          <ScoreSlider value={scoreRange} onChange={setScoreRange} />
        </div>
      )}

      {/* ─── Content ──────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-navy-100 bg-white py-16 text-center">
          <p className="text-sm text-navy-400">
            No vendors match your filters.
          </p>
          <button
            onClick={clearFilters}
            className="mt-2 text-xs font-medium text-blue hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : view === "grid" ? (
        <VendorGrid
          vendors={filtered}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
        />
      ) : (
        <VendorDataTable
          vendors={filtered}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
        />
      )}

      {/* ─── Compare floating button ──────────────────── */}
      {compareIds.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <button
            onClick={() => router.push(`/vendors/compare?ids=${[...compareIds].join(",")}`)}
            className="nav-transition flex items-center gap-2.5 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-navy/30 hover:bg-navy-600"
          >
            <GitCompareArrows size={18} />
            Compare ({compareIds.size})
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Vendor initials avatar ──────────────────────────────────

export function VendorInitials({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // Deterministic color from name
  const colors = [
    "from-blue-500 to-blue-700",
    "from-accent-500 to-accent-700",
    "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700",
    "from-orange-500 to-orange-700",
    "from-rose-500 to-rose-700",
    "from-navy-400 to-navy-600",
    "from-cyan-500 to-cyan-700",
  ];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const gradient = colors[hash % colors.length];

  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-base",
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br font-bold text-white",
        gradient,
        sizeClasses[size]
      )}
    >
      {initials}
    </div>
  );
}
