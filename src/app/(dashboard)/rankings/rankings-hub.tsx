"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Trophy,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  RefreshCw,
  ChevronDown,
  X,
  Database,
  Cloud,
  BarChart3,
  Shield,
  Workflow,
  Brain,
  Server,
  Globe,
  Lock,
  Layers,
  Cpu,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreGauge } from "../vendors/score-gauge";
import {
  calculateWeightedScore,
  normalizeScore,
  globalRankingsToCsv,
  categoryRankingsToCsv,
} from "@/lib/scoring";
import type { VendorGlobalRanking, VendorCategoryRanking } from "@/lib/scoring";

// ─── Types ──────────────────────────────────────────────────────

interface CategoryTabData {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  criteria: { id: string; key: string; name: string; weight: number }[];
  rankings: {
    vendorId: string;
    vendorName: string;
    vendorSlug: string;
    tier: string;
    hqLocation: string | null;
    founded: number | null;
    normalizedScore: number;
    rawScore: number;
    rank: number;
    dimensions: { criterionKey: string; criterionName: string; score: number; weight: number }[];
  }[];
}

interface RankingsHubProps {
  globalRankings: VendorGlobalRanking[];
  categoryData: CategoryTabData[];
}

const ICON_MAP: Record<string, typeof Database> = {
  Database, Cloud, BarChart3, Shield, Workflow, Brain, Server, Globe, Lock, Layers, Cpu, Zap,
};

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  leader: { label: "Leader", cls: "bg-emerald-100 text-emerald-800" },
  challenger: { label: "Challenger", cls: "bg-blue-100 text-blue-800" },
  emerging: { label: "Emerging", cls: "bg-amber-100 text-amber-800" },
  niche: { label: "Niche", cls: "bg-gray-100 text-gray-700" },
};

// ─── Main Component ─────────────────────────────────────────────

export function RankingsHub({ globalRankings, categoryData }: RankingsHubProps) {
  const [activeTab, setActiveTab] = useState<string>("global");
  const [showWeightPanel, setShowWeightPanel] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // Weight overrides: map of criterionKey → weight
  const [weightOverrides, setWeightOverrides] = useState<Record<string, number>>({});

  const activeCategory = categoryData.find((c) => c.id === activeTab);

  // Recompute category rankings when weights change
  const recomputedCategoryRankings = useMemo(() => {
    if (!activeCategory || Object.keys(weightOverrides).length === 0) return null;

    const overrideMap = new Map(Object.entries(weightOverrides));
    // Recompute raw scores per vendor
    const withRaw = activeCategory.rankings.map((r) => {
      let totalWeight = 0;
      let weightedSum = 0;
      for (const d of r.dimensions) {
        const w = overrideMap.get(d.criterionKey) ?? d.weight;
        totalWeight += w;
        weightedSum += d.score * w * 0.7; // use average confidence
      }
      const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
      return { ...r, rawScore };
    });

    // Normalize
    const rawScores = withRaw.map((v) => v.rawScore);
    const min = Math.min(...rawScores);
    const max = Math.max(...rawScores);

    const reranked = withRaw
      .map((v) => ({
        ...v,
        normalizedScore: normalizeScore(v.rawScore, min, max),
        rawScore: Math.round(v.rawScore * 100) / 100,
      }))
      .sort((a, b) => b.normalizedScore - a.normalizedScore || b.rawScore - a.rawScore);

    // Assign ranks
    for (let i = 0; i < reranked.length; i++) {
      if (i > 0 && reranked[i].normalizedScore === reranked[i - 1].normalizedScore) {
        reranked[i].rank = reranked[i - 1].rank;
      } else {
        reranked[i].rank = i + 1;
      }
    }

    return reranked;
  }, [activeCategory, weightOverrides]);

  const displayedCategoryRankings = recomputedCategoryRankings ?? activeCategory?.rankings ?? [];

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await fetch("/api/rankings/recalculate", { method: "POST" });
      window.location.reload();
    } catch (err) {
      console.error("Recalculation failed:", err);
      setRecalculating(false);
    }
  };

  const handleExportCsv = () => {
    let csv: string;
    let filename: string;

    if (activeTab === "global") {
      csv = globalRankingsToCsv(globalRankings);
      filename = "global-rankings.csv";
    } else if (activeCategory) {
      const asCatRankings: VendorCategoryRanking[] = displayedCategoryRankings.map((r) => ({
        vendorId: r.vendorId,
        vendorName: r.vendorName,
        vendorSlug: r.vendorSlug,
        categoryId: activeCategory.id,
        categoryName: activeCategory.name,
        rawScore: r.rawScore,
        normalizedScore: r.normalizedScore,
        rank: r.rank,
        dimensions: r.dimensions.map((d) => ({
          criterionId: "",
          criterionKey: d.criterionKey,
          criterionName: d.criterionName,
          score: d.score,
          weight: weightOverrides[d.criterionKey] ?? d.weight,
          confidence: 0.7,
        })),
      }));
      csv = categoryRankingsToCsv(asCatRankings, activeCategory.name);
      filename = `${activeCategory.slug}-rankings.csv`;
    } else {
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleWeightChange = (key: string, value: number) => {
    setWeightOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const resetWeights = () => {
    setWeightOverrides({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">Global Rankings</h1>
          <p className="mt-1 text-navy-400">
            {globalRankings.length} vendors ranked across {categoryData.length} categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeightPanel(!showWeightPanel)}
            className={cn(
              "nav-transition inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium",
              showWeightPanel
                ? "border-blue bg-blue-50 text-blue"
                : "border-navy-200 text-navy-500 hover:border-blue hover:text-blue"
            )}
          >
            <SlidersHorizontal size={14} />
            Customize Weights
          </button>
          <button
            onClick={handleExportCsv}
            className="nav-transition inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-2 text-sm font-medium text-navy-500 hover:border-blue hover:text-blue"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="nav-transition inline-flex items-center gap-1.5 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(recalculating && "animate-spin")} />
            {recalculating ? "Recalculating…" : "Recalculate"}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-navy-100">
        <button
          onClick={() => { setActiveTab("global"); setShowWeightPanel(false); resetWeights(); }}
          className={cn(
            "nav-transition flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium",
            activeTab === "global"
              ? "border-blue text-blue"
              : "border-transparent text-navy-400 hover:border-navy-200 hover:text-navy"
          )}
        >
          <Trophy size={14} />
          Global
        </button>
        {categoryData.map((cat) => {
          const CatIcon = ICON_MAP[cat.icon ?? ""] ?? Database;
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveTab(cat.id); resetWeights(); }}
              className={cn(
                "nav-transition flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium",
                activeTab === cat.id
                  ? "border-blue text-blue"
                  : "border-transparent text-navy-400 hover:border-navy-200 hover:text-navy"
              )}
            >
              <CatIcon size={13} />
              <span className="hidden sm:inline">{cat.name}</span>
              <span className="sm:hidden">{cat.name.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Weight customizer panel */}
      {showWeightPanel && activeCategory && (
        <WeightCustomizer
          criteria={activeCategory.criteria}
          overrides={weightOverrides}
          onChange={handleWeightChange}
          onReset={resetWeights}
          onClose={() => setShowWeightPanel(false)}
          color={activeCategory.color ?? "#2E75B6"}
        />
      )}
      {showWeightPanel && activeTab === "global" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <SlidersHorizontal size={14} className="mr-1.5 inline" />
          Select a category tab to customize dimension weights. Global rankings are derived from category scores.
        </div>
      )}

      {/* Content */}
      {activeTab === "global" ? (
        <GlobalLeaderboard rankings={globalRankings} />
      ) : activeCategory ? (
        <CategoryLeaderboard
          category={activeCategory}
          rankings={displayedCategoryRankings}
          weightOverrides={weightOverrides}
        />
      ) : null}
    </div>
  );
}

// ─── Weight Customizer ──────────────────────────────────────────

function WeightCustomizer({
  criteria,
  overrides,
  onChange,
  onReset,
  onClose,
  color,
}: {
  criteria: CategoryTabData["criteria"];
  overrides: Record<string, number>;
  onChange: (key: string, value: number) => void;
  onReset: () => void;
  onClose: () => void;
  color: string;
}) {
  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} style={{ color }} />
          <h3 className="text-sm font-semibold text-navy">Dimension Weight Customizer</h3>
          {hasOverrides && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
              Modified
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasOverrides && (
            <button
              onClick={onReset}
              className="text-xs font-medium text-navy-400 hover:text-navy"
            >
              Reset to defaults
            </button>
          )}
          <button onClick={onClose} className="rounded p-1 text-navy-300 hover:bg-navy-100 hover:text-navy">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {criteria.map((c) => {
          const currentWeight = overrides[c.key] ?? c.weight;
          const isModified = overrides[c.key] !== undefined;
          return (
            <div key={c.id} className="rounded-lg border border-navy-100 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className={cn("text-xs font-medium", isModified ? "text-blue" : "text-navy-500")}>
                  {c.name}
                </span>
                <span className={cn("text-sm font-bold", isModified ? "text-blue" : "text-navy")}>
                  {currentWeight.toFixed(1)}×
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={currentWeight}
                onChange={(e) => onChange(c.key, parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-navy-100 accent-blue [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue [&::-webkit-slider-thumb]:shadow-md"
              />
              <div className="mt-1 flex justify-between text-[9px] text-navy-300">
                <span>0</span>
                <span>Default: {c.weight}</span>
                <span>3</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-navy-400">
        Adjust dimension weights to re-rank vendors in real-time. Rankings update instantly as you change weights.
      </p>
    </div>
  );
}

// ─── Global Leaderboard ─────────────────────────────────────────

type GlobalSortField = "overallRank" | "vendorName" | "overallScore" | "tier";
type SortDir = "asc" | "desc";

function GlobalLeaderboard({ rankings }: { rankings: VendorGlobalRanking[] }) {
  const [sortField, setSortField] = useState<GlobalSortField>("overallRank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (field: GlobalSortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "vendorName" || field === "tier" ? "asc" : field === "overallRank" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    const arr = [...rankings];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "overallRank":
          cmp = a.overallRank - b.overallRank;
          break;
        case "vendorName":
          cmp = a.vendorName.localeCompare(b.vendorName);
          break;
        case "overallScore":
          cmp = a.overallScore - b.overallScore;
          break;
        case "tier": {
          const o = { leader: 0, challenger: 1, emerging: 2, niche: 3 };
          cmp = (o[a.tier as keyof typeof o] ?? 4) - (o[b.tier as keyof typeof o] ?? 4);
          break;
        }
      }
      return cmp * dir;
    });
    return arr;
  }, [rankings, sortField, sortDir]);

  // Collect all categories for column headers
  const allCategories = useMemo(() => {
    const catSet = new Map<string, { name: string; color: string | null }>();
    rankings.forEach((r) =>
      r.categoryRankings.forEach((c) => catSet.set(c.categoryId, { name: c.categoryName, color: c.categoryColor }))
    );
    return [...catSet.entries()];
  }, [rankings]);

  return (
    <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50/60">
              <SortTh field="overallRank" label="#" currentField={sortField} currentDir={sortDir} onClick={handleSort} />
              <SortTh field="vendorName" label="Vendor" currentField={sortField} currentDir={sortDir} onClick={handleSort} align="left" />
              <SortTh field="overallScore" label="Overall Score" currentField={sortField} currentDir={sortDir} onClick={handleSort} />
              <SortTh field="tier" label="Tier" currentField={sortField} currentDir={sortDir} onClick={handleSort} />
              {allCategories.slice(0, 6).map(([id, { name }]) => (
                <th
                  key={id}
                  className="whitespace-nowrap px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-navy-400"
                  title={name}
                >
                  {name.length > 14 ? name.slice(0, 12) + "…" : name}
                </th>
              ))}
              <th className="w-16 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.vendorId} className="nav-transition border-b border-navy-50 hover:bg-navy-50/40">
                <td className="px-3 py-3 text-center">
                  <RankBadge rank={r.overallRank} />
                </td>
                <td className="px-3 py-3">
                  <Link href={`/vendors/${r.vendorSlug}`} className="font-medium text-navy hover:text-blue">
                    {r.vendorName}
                  </Link>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="inline-flex">
                    <ScoreGauge score={r.overallScore} size={38} strokeWidth={3} />
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", (TIER_BADGE[r.tier] ?? TIER_BADGE.emerging).cls)}>
                    {(TIER_BADGE[r.tier] ?? TIER_BADGE.emerging).label}
                  </span>
                </td>
                {allCategories.slice(0, 6).map(([catId]) => {
                  const catRank = r.categoryRankings.find((c) => c.categoryId === catId);
                  return (
                    <td key={catId} className="px-2 py-3 text-center">
                      {catRank ? (
                        <ScoreCell score={catRank.score} />
                      ) : (
                        <span className="text-[10px] text-navy-200">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-3">
                  <Link
                    href={`/vendors/${r.vendorSlug}`}
                    className="nav-transition rounded-md border border-navy-100 px-2.5 py-1 text-xs font-medium text-navy-500 hover:border-blue hover:text-blue"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Category Leaderboard ───────────────────────────────────────

type CatSortField = "rank" | "vendorName" | "normalizedScore" | "tier";

function CategoryLeaderboard({
  category,
  rankings,
  weightOverrides,
}: {
  category: CategoryTabData;
  rankings: CategoryTabData["rankings"];
  weightOverrides: Record<string, number>;
}) {
  const [sortField, setSortField] = useState<CatSortField>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (field: CatSortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "vendorName" || field === "tier" ? "asc" : field === "rank" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    const arr = [...rankings];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "rank":
          cmp = a.rank - b.rank;
          break;
        case "vendorName":
          cmp = a.vendorName.localeCompare(b.vendorName);
          break;
        case "normalizedScore":
          cmp = a.normalizedScore - b.normalizedScore;
          break;
        case "tier": {
          const o = { leader: 0, challenger: 1, emerging: 2, niche: 3 };
          cmp = (o[a.tier as keyof typeof o] ?? 4) - (o[b.tier as keyof typeof o] ?? 4);
          break;
        }
      }
      return cmp * dir;
    });
    return arr;
  }, [rankings, sortField, sortDir]);

  const dimCols = category.criteria.slice(0, 6);
  const hasOverrides = Object.keys(weightOverrides).length > 0;

  return (
    <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
      {hasOverrides && (
        <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/30 px-6 py-2">
          <SlidersHorizontal size={12} className="text-blue" />
          <span className="text-xs font-medium text-blue">Custom weights applied — rankings updated in real-time</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50/60">
              <SortTh field="rank" label="#" currentField={sortField} currentDir={sortDir} onClick={handleSort} />
              <SortTh field="vendorName" label="Vendor" currentField={sortField} currentDir={sortDir} onClick={handleSort} align="left" />
              <SortTh field="normalizedScore" label="Score" currentField={sortField} currentDir={sortDir} onClick={handleSort} />
              <SortTh field="tier" label="Tier" currentField={sortField} currentDir={sortDir} onClick={handleSort} />
              {dimCols.map((dim) => (
                <th
                  key={dim.key}
                  className="whitespace-nowrap px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-navy-400"
                  title={`${dim.name} (weight: ${weightOverrides[dim.key]?.toFixed(1) ?? dim.weight})`}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {dim.name.length > 14 ? dim.name.slice(0, 12) + "…" : dim.name}
                    {weightOverrides[dim.key] !== undefined && (
                      <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-blue" />
                    )}
                  </span>
                </th>
              ))}
              <th className="px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                Raw
              </th>
              <th className="w-16 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.vendorId} className="nav-transition border-b border-navy-50 hover:bg-navy-50/40">
                <td className="px-3 py-3 text-center">
                  <RankBadge rank={r.rank} />
                </td>
                <td className="px-3 py-3">
                  <div>
                    <Link href={`/vendors/${r.vendorSlug}`} className="font-medium text-navy hover:text-blue">
                      {r.vendorName}
                    </Link>
                    {r.hqLocation && (
                      <p className="truncate text-[10px] text-navy-300">{r.hqLocation}</p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="inline-flex">
                    <ScoreGauge score={r.normalizedScore} size={38} strokeWidth={3} />
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", (TIER_BADGE[r.tier] ?? TIER_BADGE.emerging).cls)}>
                    {(TIER_BADGE[r.tier] ?? TIER_BADGE.emerging).label}
                  </span>
                </td>
                {dimCols.map((dim) => {
                  const d = r.dimensions.find((dd) => dd.criterionKey === dim.key);
                  const score = d ? Math.round(d.score * 10) : 0; // 0-10 → 0-100
                  return (
                    <td key={dim.key} className="px-2 py-3 text-center">
                      <ScoreCell score={score} />
                    </td>
                  );
                })}
                <td className="px-2 py-3 text-center text-xs text-navy-400">
                  {r.rawScore.toFixed(1)}
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/vendors/${r.vendorSlug}`}
                    className="nav-transition rounded-md border border-navy-100 px-2.5 py-1 text-xs font-medium text-navy-500 hover:border-blue hover:text-blue"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared Helpers ─────────────────────────────────────────────

function SortTh<T extends string>({
  field,
  label,
  currentField,
  currentDir,
  onClick,
  align = "center",
}: {
  field: T;
  label: string;
  currentField: T;
  currentDir: SortDir;
  onClick: (f: T) => void;
  align?: "left" | "center";
}) {
  const isActive = currentField === field;
  return (
    <th
      className={cn(
        "cursor-pointer select-none whitespace-nowrap px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-navy-400 hover:text-navy",
        align === "center" && "text-center"
      )}
      onClick={() => onClick(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === "asc" ? <ArrowUp size={11} className="text-blue" /> : <ArrowDown size={11} className="text-blue" />
        ) : (
          <ArrowUpDown size={11} className="opacity-30" />
        )}
      </span>
    </th>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">1</span>;
  if (rank === 2) return <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">2</span>;
  if (rank === 3) return <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-600">3</span>;
  return <span className="text-xs font-medium text-navy-400">{rank}</span>;
}

function ScoreCell({ score }: { score: number }) {
  const color =
    score >= 75 ? "text-emerald-600 bg-emerald-50"
      : score >= 50 ? "text-blue-600 bg-blue-50"
        : score >= 25 ? "text-amber-600 bg-amber-50"
          : "text-red-500 bg-red-50";
  return (
    <span className={cn("inline-block rounded px-1.5 py-0.5 text-xs font-bold", color)}>
      {score}
    </span>
  );
}
