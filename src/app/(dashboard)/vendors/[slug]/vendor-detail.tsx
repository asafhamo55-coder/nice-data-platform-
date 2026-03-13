"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  FileText,
  Github,
  MapPin,
  Calendar,
  Users,
  Building2,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Package,
  Layers,
  Star,
  Shield,
  Zap,
  BarChart3,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreGauge } from "../score-gauge";
import { VendorInitials } from "../vendor-hub";
import { BenchmarksTab } from "./benchmarks-tab";
import { PricingTab } from "./pricing-tab";

// ─── Types ──────────────────────────────────────────────────────

export interface VendorDetailData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  founded: number | null;
  hqLocation: string | null;
  employeeRange: string | null;
  marketCap: string | null;
  revenue: string | null;
  tier: string;
  type: "commercial" | "open-source" | "open-core";
  overallScore: number;
  primaryCategory: { id: string; name: string; slug: string; color: string | null } | null;
  categories: { id: string; name: string; slug: string; color: string | null; isPrimary: boolean }[];
  dimensions: { key: string; name: string; score: number; weight: number; confidence: number; category: string }[];
  products: ProductData[];
  benchmarkResults: BenchmarkResultData[];
  evaluations: EvaluationData[];
}

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pricingModel: string | null;
  pricingUrl: string | null;
  tier: string | null;
  capabilities: CapabilityData[];
}

export interface CapabilityData {
  id: string;
  name: string;
  key: string;
  description: string | null;
  maturity: string;
  rating: number | null;
}

export interface BenchmarkResultData {
  id: string;
  value: number;
  testDate: string;
  benchmark: {
    id: string;
    name: string;
    key: string;
    unit: string | null;
    higherIsBetter: boolean;
    category: string;
  };
}

export interface EvaluationData {
  id: string;
  title: string;
  status: string;
  summary: string | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComparisonVendor {
  id: string;
  name: string;
  slug: string;
  dimensions: { key: string; name: string; score: number }[];
}

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  commercial: { label: "Commercial", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  "open-source": { label: "Open Source", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "open-core": { label: "Open Core", cls: "bg-violet-50 text-violet-700 border-violet-200" },
};

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  leader: { label: "Leader", cls: "bg-emerald-100 text-emerald-800" },
  challenger: { label: "Challenger", cls: "bg-blue-100 text-blue-800" },
  emerging: { label: "Emerging", cls: "bg-amber-100 text-amber-800" },
  niche: { label: "Niche", cls: "bg-gray-100 text-gray-700" },
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "products", label: "Products" },
  { key: "benchmarks", label: "Benchmarks" },
  { key: "pricing", label: "Pricing" },
  { key: "integration", label: "Integration" },
  { key: "evaluations", label: "Evaluations" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const MATURITY_BADGE: Record<string, { label: string; cls: string }> = {
  ga: { label: "GA", cls: "bg-emerald-50 text-emerald-700" },
  mature: { label: "Mature", cls: "bg-blue-50 text-blue-700" },
  preview: { label: "Preview", cls: "bg-amber-50 text-amber-700" },
  deprecated: { label: "Deprecated", cls: "bg-red-50 text-red-600" },
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  completed: { icon: CheckCircle2, cls: "text-emerald-600", label: "Completed" },
  in_progress: { icon: Clock, cls: "text-blue-600", label: "In Progress" },
  draft: { icon: AlertCircle, cls: "text-amber-600", label: "Draft" },
  archived: { icon: Minus, cls: "text-gray-400", label: "Archived" },
};

// ─── Main Component ─────────────────────────────────────────────

interface VendorDetailProps {
  vendor: VendorDetailData;
  comparisonVendors: ComparisonVendor[];
}

export function VendorDetail({ vendor, comparisonVendors }: VendorDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const typeBadge = TYPE_BADGE[vendor.type] ?? TYPE_BADGE.commercial;
  const tierBadge = TIER_BADGE[vendor.tier] ?? TIER_BADGE.emerging;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/vendors"
        className="nav-transition inline-flex items-center gap-1.5 text-sm text-navy-400 hover:text-blue"
      >
        <ArrowLeft size={14} />
        Back to Vendors
      </Link>

      {/* ─── Hero Section ──────────────────────────────────────── */}
      <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: Identity */}
          <div className="flex items-start gap-5">
            <VendorInitials name={vendor.name} size="lg" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-navy">{vendor.name}</h1>
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", typeBadge.cls)}>
                  {typeBadge.label}
                </span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", tierBadge.cls)}>
                  {tierBadge.label}
                </span>
              </div>
              {vendor.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-navy-400">{vendor.description}</p>
              )}
              {/* Category badges */}
              <div className="flex flex-wrap gap-1.5">
                {vendor.categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="nav-transition inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium text-white hover:opacity-80"
                    style={{ backgroundColor: cat.color ?? "#5476a9" }}
                  >
                    {cat.name}
                    {cat.isPrimary && <Star size={8} className="ml-1" />}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Score */}
          <div className="flex flex-col items-center gap-1">
            <ScoreGauge score={vendor.overallScore} size={80} strokeWidth={5} />
            <span className="text-[11px] font-medium text-navy-300">Overall Score</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-navy-50 pt-5 sm:grid-cols-3 lg:grid-cols-6">
          {vendor.founded && (
            <StatItem icon={Calendar} label="Founded" value={String(vendor.founded)} />
          )}
          {vendor.hqLocation && (
            <StatItem icon={MapPin} label="Headquarters" value={vendor.hqLocation} />
          )}
          {vendor.employeeRange && (
            <StatItem icon={Users} label="Employees" value={vendor.employeeRange} />
          )}
          <StatItem icon={Package} label="Products" value={String(vendor.products.length)} />
          <StatItem icon={Layers} label="Categories" value={String(vendor.categories.length)} />
          <StatItem
            icon={TrendingUp}
            label="Pricing"
            value={vendor.products[0]?.pricingModel?.replace("-", " ") ?? "N/A"}
          />
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex flex-wrap gap-2">
          {vendor.website && (
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-transition inline-flex items-center gap-1.5 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Globe size={14} />
              Visit Website
            </a>
          )}
          <button className="nav-transition inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-500 hover:border-blue hover:text-blue">
            <FileText size={14} />
            View Docs
          </button>
          <button className="nav-transition inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-500 hover:border-blue hover:text-blue">
            <Github size={14} />
            GitHub
          </button>
        </div>
      </div>

      {/* ─── Score Breakdown ───────────────────────────────────── */}
      <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-navy">Score Breakdown</h2>
        {vendor.dimensions.length > 0 ? (
          <div className="space-y-3">
            {vendor.dimensions
              .sort((a, b) => b.score - a.score)
              .map((dim) => (
                <DimensionBar key={dim.key} dimension={dim} />
              ))}
          </div>
        ) : (
          <p className="text-sm text-navy-300">No score data available.</p>
        )}
      </div>

      {/* ─── Tab Navigation ────────────────────────────────────── */}
      <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-navy-100">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "nav-transition whitespace-nowrap border-b-2 px-5 py-3.5 text-sm font-medium",
                activeTab === tab.key
                  ? "border-blue text-blue"
                  : "border-transparent text-navy-400 hover:border-navy-200 hover:text-navy"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "overview" && <OverviewTab vendor={vendor} />}
          {activeTab === "products" && <ProductsTab products={vendor.products} />}
          {activeTab === "benchmarks" && (
            <BenchmarksTab
              vendor={vendor}
              comparisonVendors={comparisonVendors}
            />
          )}
          {activeTab === "pricing" && <PricingTab vendor={vendor} />}
          {activeTab === "integration" && <IntegrationTab vendor={vendor} />}
          {activeTab === "evaluations" && <EvaluationsTab evaluations={vendor.evaluations} />}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function StatItem({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50">
        <Icon size={14} className="text-navy-400" />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-navy-300">{label}</p>
        <p className="text-sm font-semibold capitalize text-navy">{value}</p>
      </div>
    </div>
  );
}

function DimensionBar({ dimension }: { dimension: VendorDetailData["dimensions"][number] }) {
  const color =
    dimension.score >= 75
      ? "from-emerald-400 to-emerald-500"
      : dimension.score >= 50
        ? "from-blue to-blue-600"
        : dimension.score >= 25
          ? "from-amber-400 to-amber-500"
          : "from-red-400 to-red-500";

  return (
    <div className="flex items-center gap-4">
      <span className="w-36 shrink-0 text-sm font-medium text-navy-500">{dimension.name}</span>
      <div className="relative flex-1">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-navy-50">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r nav-transition", color)}
            style={{ width: `${dimension.score}%` }}
          />
        </div>
      </div>
      <span className="w-10 text-right text-sm font-bold text-navy">{dimension.score}</span>
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────

function OverviewTab({ vendor }: { vendor: VendorDetailData }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      {vendor.description && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-navy">About {vendor.name}</h3>
          <p className="text-sm leading-relaxed text-navy-400">{vendor.description}</p>
        </div>
      )}

      {/* Key metrics grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          icon={BarChart3}
          title="Overall Score"
          value={`${vendor.overallScore}/100`}
          subtitle={`${vendor.dimensions.length} dimensions evaluated`}
        />
        <MetricCard
          icon={Package}
          title="Products"
          value={String(vendor.products.length)}
          subtitle={`${vendor.products.reduce((sum, p) => sum + p.capabilities.length, 0)} capabilities`}
        />
        <MetricCard
          icon={Shield}
          title="Tier"
          value={vendor.tier.charAt(0).toUpperCase() + vendor.tier.slice(1)}
          subtitle={`${vendor.type.replace("-", " ")} vendor`}
        />
      </div>

      {/* Top dimensions */}
      {vendor.dimensions.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-navy">Top Strengths</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vendor.dimensions
              .sort((a, b) => b.score - a.score)
              .slice(0, 3)
              .map((dim) => (
                <div key={dim.key} className="rounded-lg border border-navy-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-navy">{dim.name}</span>
                    <span className="text-lg font-bold text-emerald-600">{dim.score}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-navy-300">
                    Weight: {dim.weight} · Confidence: {Math.round(dim.confidence * 100)}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Products preview */}
      {vendor.products.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-navy">Products Overview</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {vendor.products.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-navy-50 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <Package size={16} className="text-blue" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy">{p.name}</p>
                  <p className="text-[11px] text-navy-300">
                    {p.capabilities.length} capabilities · {p.pricingModel ?? "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: typeof BarChart3;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-lg border border-navy-50 p-4">
      <div className="flex items-center gap-2 text-navy-400">
        <Icon size={14} />
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
      <p className="mt-0.5 text-[11px] text-navy-300">{subtitle}</p>
    </div>
  );
}

// ─── Products Tab ───────────────────────────────────────────────

function ProductsTab({ products }: { products: ProductData[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (products.length === 0) {
    return <p className="text-sm text-navy-300">No products listed for this vendor.</p>;
  }

  return (
    <div className="space-y-3">
      {products.map((product) => {
        const isOpen = expanded.has(product.id);
        return (
          <div key={product.id} className="overflow-hidden rounded-lg border border-navy-100">
            {/* Header */}
            <button
              onClick={() => toggle(product.id)}
              className="nav-transition flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-navy-50/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Package size={18} className="text-blue" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-navy">{product.name}</h3>
                  {product.tier && (
                    <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium capitalize text-navy-400">
                      {product.tier}
                    </span>
                  )}
                  {product.pricingModel && (
                    <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-medium capitalize text-accent-700">
                      {product.pricingModel.replace("-", " ")}
                    </span>
                  )}
                </div>
                {product.description && (
                  <p className="mt-0.5 truncate text-xs text-navy-400">{product.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-navy-300">{product.capabilities.length} capabilities</span>
                {isOpen ? (
                  <ChevronDown size={16} className="text-navy-300" />
                ) : (
                  <ChevronRight size={16} className="text-navy-300" />
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="border-t border-navy-50 bg-navy-50/20 px-5 py-4">
                {product.capabilities.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-400">
                      Capabilities
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.capabilities.map((cap) => {
                        const maturity = MATURITY_BADGE[cap.maturity] ?? MATURITY_BADGE.ga;
                        return (
                          <div
                            key={cap.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-navy-100 bg-white px-3 py-1.5"
                          >
                            <span className="text-xs font-medium text-navy">{cap.name}</span>
                            <span className={cn("rounded px-1.5 py-px text-[9px] font-medium", maturity.cls)}>
                              {maturity.label}
                            </span>
                            {cap.rating !== null && (
                              <span className="text-[10px] font-bold text-blue">{cap.rating.toFixed(1)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-navy-300">No capabilities listed.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Integration Tab ────────────────────────────────────────────

function IntegrationTab({ vendor }: { vendor: VendorDetailData }) {
  const allCapabilities = vendor.products.flatMap((p) => p.capabilities);
  const integrationCaps = allCapabilities.filter(
    (c) => c.key.includes("integration") || c.key.includes("connect") || c.key.includes("api")
  );
  const otherCaps = allCapabilities.filter(
    (c) => !c.key.includes("integration") && !c.key.includes("connect") && !c.key.includes("api")
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-navy">Integration Capabilities</h3>
        {integrationCaps.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {integrationCaps.map((cap) => (
              <div key={cap.id} className="rounded-lg border border-navy-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-navy">{cap.name}</span>
                  {cap.rating !== null && (
                    <span className="text-sm font-bold text-blue">{cap.rating.toFixed(1)}</span>
                  )}
                </div>
                <span className={cn("mt-1 inline-block rounded px-1.5 py-px text-[9px] font-medium", (MATURITY_BADGE[cap.maturity] ?? MATURITY_BADGE.ga).cls)}>
                  {(MATURITY_BADGE[cap.maturity] ?? MATURITY_BADGE.ga).label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-navy-300">No specific integration capabilities listed.</p>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-navy">All Capabilities ({allCapabilities.length})</h3>
        <div className="flex flex-wrap gap-2">
          {allCapabilities.map((cap) => (
            <span
              key={cap.id}
              className="inline-flex items-center gap-1 rounded-full border border-navy-100 px-2.5 py-1 text-xs text-navy-500"
            >
              <Zap size={10} className="text-blue" />
              {cap.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Evaluations Tab ────────────────────────────────────────────

function EvaluationsTab({ evaluations }: { evaluations: EvaluationData[] }) {
  if (evaluations.length === 0) {
    return (
      <div className="py-8 text-center">
        <AlertCircle size={32} className="mx-auto text-navy-200" />
        <p className="mt-2 text-sm text-navy-300">No evaluations yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {evaluations.map((ev) => {
        const statusCfg = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.draft;
        const StatusIcon = statusCfg.icon;
        return (
          <div key={ev.id} className="flex items-start gap-4 rounded-lg border border-navy-50 p-4">
            <StatusIcon size={18} className={statusCfg.cls} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-navy">{ev.title}</h4>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusCfg.cls)}>
                  {statusCfg.label}
                </span>
              </div>
              {ev.summary && (
                <p className="mt-1 text-xs text-navy-400 line-clamp-2">{ev.summary}</p>
              )}
              <div className="mt-2 flex items-center gap-3 text-[11px] text-navy-300">
                {ev.score !== null && (
                  <span className="font-semibold text-blue">Score: {ev.score.toFixed(1)}</span>
                )}
                <span>Updated {new Date(ev.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
