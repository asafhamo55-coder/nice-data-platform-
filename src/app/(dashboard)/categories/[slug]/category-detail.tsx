"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
  Trophy,
  Check,
  X as XIcon,
  Minus,
  Plus,
  Lightbulb,
  Building2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreGauge } from "../../vendors/score-gauge";
import { RadarComparisonChart } from "./radar-comparison";
import { FeatureMatrix } from "./feature-matrix";
import { WhenToChoose } from "./when-to-choose";
import { NiceContext } from "./nice-context";

// ─── Types ──────────────────────────────────────────────────────

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

export interface CategoryVendor {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  tier: string;
  founded: number | null;
  hqLocation: string | null;
  employeeRange: string | null;
  isPrimary: boolean;
  overallScore: number;
  dimensions: { key: string; name: string; score: number; weight: number }[];
  capabilities: { key: string; name: string; maturity: string; rating: number | null; productName: string }[];
  productCount: number;
}

export interface CriterionData {
  id: string;
  name: string;
  key: string;
  weight: number;
  description: string | null;
}

export interface BenchmarkData {
  id: string;
  name: string;
  key: string;
  unit: string | null;
  higherIsBetter: boolean;
  results: { vendorId: string; vendorName: string; value: number }[];
}

// ─── Icon map ───────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof Database> = {
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
};

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  leader: { label: "Leader", cls: "bg-emerald-100 text-emerald-800" },
  challenger: { label: "Challenger", cls: "bg-blue-100 text-blue-800" },
  emerging: { label: "Emerging", cls: "bg-amber-100 text-amber-800" },
  niche: { label: "Niche", cls: "bg-gray-100 text-gray-700" },
};

type SortField = "rank" | "name" | "overallScore" | "tier" | "productCount";
type SortDir = "asc" | "desc";

// ─── Main Component ─────────────────────────────────────────────

interface CategoryDetailProps {
  category: CategoryData;
  vendors: CategoryVendor[];
  criteria: CriterionData[];
  benchmarks: BenchmarkData[];
}

export function CategoryDetail({ category, vendors, criteria, benchmarks }: CategoryDetailProps) {
  const Icon = ICON_MAP[category.icon ?? ""] ?? Database;
  const color = category.color ?? "#2E75B6";

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/categories"
        className="nav-transition inline-flex items-center gap-1.5 text-sm text-navy-400 hover:text-blue"
      >
        <ArrowLeft size={14} />
        Back to Categories
      </Link>

      {/* ─── 1. Hero Section ───────────────────────────────────── */}
      <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon size={28} style={{ color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">{category.name}</h1>
              {category.description && (
                <p className="mt-1 max-w-2xl text-sm text-navy-400">{category.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color }}>{vendors.length}</p>
              <p className="text-[11px] font-medium text-navy-300">Vendors</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy">{criteria.length}</p>
              <p className="text-[11px] font-medium text-navy-300">Criteria</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy">{benchmarks.length}</p>
              <p className="text-[11px] font-medium text-navy-300">Benchmarks</p>
            </div>
          </div>
        </div>

        {/* Criteria pills */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-navy-50 pt-4">
          {criteria.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-navy-100 px-3 py-1 text-xs text-navy-500"
            >
              {c.name}
              <span className="rounded bg-navy-50 px-1 py-px text-[9px] font-bold text-navy-400">
                ×{c.weight}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── 2. Vendor Leaderboard ─────────────────────────────── */}
      <LeaderboardTable
        vendors={vendors}
        criteria={criteria}
        benchmarks={benchmarks}
        color={color}
      />

      {/* ─── 3. Feature Matrix ─────────────────────────────────── */}
      <FeatureMatrix vendors={vendors} color={color} />

      {/* ─── 4. Radar Comparison ───────────────────────────────── */}
      <RadarComparisonChart vendors={vendors} criteria={criteria} color={color} />

      {/* ─── 5. When to Choose ─────────────────────────────────── */}
      <WhenToChoose vendors={vendors} category={category} color={color} />

      {/* ─── 6. NICE Context ───────────────────────────────────── */}
      <NiceContext category={category} color={color} />
    </div>
  );
}

// ─── Leaderboard Table ──────────────────────────────────────────

function LeaderboardTable({
  vendors,
  criteria,
  benchmarks,
  color,
}: {
  vendors: CategoryVendor[];
  criteria: CriterionData[];
  benchmarks: BenchmarkData[];
  color: string;
}) {
  const [sortField, setSortField] = useState<SortField>("overallScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" || field === "tier" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    const arr = vendors.map((v, i) => ({ ...v, rank: i + 1 }));
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "rank":
        case "overallScore":
          cmp = a.overallScore - b.overallScore;
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "tier": {
          const order = { leader: 0, challenger: 1, emerging: 2, niche: 3 };
          cmp = (order[a.tier as keyof typeof order] ?? 4) - (order[b.tier as keyof typeof order] ?? 4);
          break;
        }
        case "productCount":
          cmp = a.productCount - b.productCount;
          break;
      }
      return cmp * dir;
    });
    return arr;
  }, [vendors, sortField, sortDir]);

  // Column headers for criteria dimension scores
  const dimensionCols = criteria.slice(0, 4); // show top 4 criteria as columns

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortDir === "asc" ? (
        <ArrowUp size={11} className="text-blue" />
      ) : (
        <ArrowDown size={11} className="text-blue" />
      )
    ) : (
      <ArrowUpDown size={11} className="opacity-30" />
    );

  return (
    <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-navy-100 px-6 py-4">
        <Trophy size={18} style={{ color }} />
        <h2 className="text-lg font-semibold text-navy">Vendor Leaderboard</h2>
        <span className="ml-auto rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-medium text-navy-400">
          {vendors.length} vendors
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50/60">
              <ThSort label="#" field="rank" onClick={handleSort}>
                <SortIcon field="rank" />
              </ThSort>
              <ThSort label="Vendor" field="name" onClick={handleSort} align="left">
                <SortIcon field="name" />
              </ThSort>
              <ThSort label="Score" field="overallScore" onClick={handleSort}>
                <SortIcon field="overallScore" />
              </ThSort>
              <ThSort label="Tier" field="tier" onClick={handleSort}>
                <SortIcon field="tier" />
              </ThSort>
              {dimensionCols.map((dim) => (
                <th
                  key={dim.key}
                  className="whitespace-nowrap px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-navy-400"
                >
                  {dim.name}
                </th>
              ))}
              <ThSort label="Products" field="productCount" onClick={handleSort}>
                <SortIcon field="productCount" />
              </ThSort>
              <th className="w-16 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((v, idx) => {
              const originalRank = vendors.findIndex((ov) => ov.id === v.id) + 1;
              return (
                <tr
                  key={v.id}
                  className="nav-transition border-b border-navy-50 hover:bg-navy-50/40"
                >
                  <td className="px-3 py-3 text-center">
                    <RankBadge rank={originalRank} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {v.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/vendors/${v.slug}`}
                          className="font-medium text-navy hover:text-blue"
                        >
                          {v.name}
                        </Link>
                        {v.hqLocation && (
                          <p className="truncate text-[10px] text-navy-300">{v.hqLocation}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="inline-flex">
                      <ScoreGauge score={v.overallScore} size={38} strokeWidth={3} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                        (TIER_BADGE[v.tier] ?? TIER_BADGE.emerging).cls
                      )}
                    >
                      {(TIER_BADGE[v.tier] ?? TIER_BADGE.emerging).label}
                    </span>
                  </td>
                  {dimensionCols.map((dim) => {
                    const dimScore = v.dimensions.find((d) => d.key === dim.key)?.score ?? 0;
                    return (
                      <td key={dim.key} className="px-3 py-3 text-center">
                        <ScoreCell score={dimScore} />
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center text-navy-500">{v.productCount}</td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/vendors/${v.slug}`}
                      className="nav-transition rounded-md border border-navy-100 px-2.5 py-1 text-xs font-medium text-navy-500 hover:border-blue hover:text-blue"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Table Helpers ───────────────────────────────────────────────

function ThSort({
  label,
  field,
  onClick,
  align = "center",
  children,
}: {
  label: string;
  field: SortField;
  onClick: (f: SortField) => void;
  align?: "left" | "center";
  children: React.ReactNode;
}) {
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
        {children}
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
    score >= 75
      ? "text-emerald-600 bg-emerald-50"
      : score >= 50
        ? "text-blue-600 bg-blue-50"
        : score >= 25
          ? "text-amber-600 bg-amber-50"
          : "text-red-500 bg-red-50";
  return (
    <span className={cn("inline-block rounded px-1.5 py-0.5 text-xs font-bold", color)}>
      {score}
    </span>
  );
}
