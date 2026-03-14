"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Database,
  Workflow,
  BarChart3,
  Shield,
  Brain,
  Zap,
  Cpu,
  Server,
  Globe,
  Lock,
  Cloud,
  Layers,
  Building2,
  Trophy,
  Newspaper,
  Bot,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Sparkles,
  Calculator,
  ClipboardCheck,
  MessageSquare,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────

interface DashboardStats {
  vendors: number;
  categories: number;
  benchmarks: number;
  dataPoints: number;
  evaluations: number;
  news: number;
}

interface CategoryCard {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  vendorCount: number;
  topVendor: { name: string; slug: string; score: number | null } | null;
  health: "fresh" | "aging" | "stale";
}

interface NewsItem {
  id: string;
  title: string;
  summary: string | null;
  source: string | null;
  newsCategory: string;
  sentiment: string;
  relevance: number;
  publishedAt: string;
  url: string;
  tags: string[];
  vendor: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
}

interface AgentRun {
  id: string;
  agent: string;
  status: string;
  itemsFound: number;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  error: string | null;
}

interface DashboardData {
  stats: DashboardStats;
  categories: CategoryCard[];
  news: NewsItem[];
  agentRuns: AgentRun[];
}

// ─── Category icon mapping ──────────────────────────────────────

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "cloud-data-warehouses": Database,
  "etl-data-integration": Workflow,
  "bi-analytics": BarChart3,
  "data-governance": Shield,
  "ai-ml-platforms": Brain,
  "data-quality": Zap,
  "stream-processing": Cpu,
  "data-lakes": Server,
  "api-management": Globe,
  "data-security": Lock,
  "cloud-platforms": Cloud,
  "reverse-etl": Layers,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  "cloud-data-warehouses": "from-blue-500 to-blue-700",
  "etl-data-integration": "from-indigo-500 to-indigo-700",
  "bi-analytics": "from-violet-500 to-violet-700",
  "data-governance": "from-emerald-500 to-emerald-700",
  "ai-ml-platforms": "from-fuchsia-500 to-fuchsia-700",
  "data-quality": "from-amber-500 to-amber-700",
  "stream-processing": "from-rose-500 to-rose-700",
  "data-lakes": "from-cyan-500 to-cyan-700",
  "api-management": "from-teal-500 to-teal-700",
  "data-security": "from-red-500 to-red-700",
  "cloud-platforms": "from-sky-500 to-sky-700",
  "reverse-etl": "from-orange-500 to-orange-700",
};

// ─── Stagger animation variants ─────────────────────────────────

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 24 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

// ─── Main Component ─────────────────────────────────────────────

export function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState<{
    step: number;
    totalSteps: number;
    name: string;
  } | null>(null);
  const [refreshResult, setRefreshResult] = useState<{
    status: string;
    newsCollected: number;
    newVendorsCreated: number;
    vendorsUpdated: number;
    totalDurationMs: number;
  } | null>(null);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // SSE refresh handler
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshProgress(null);
    setRefreshResult(null);

    try {
      const res = await fetch("/api/agents/refresh-all", { method: "POST" });
      if (!res.ok) throw new Error("Refresh failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No body");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "step") {
              setRefreshProgress({
                step: event.step,
                totalSteps: event.totalSteps,
                name: event.name,
              });
            } else if (event.type === "summary") {
              setRefreshResult({
                status: event.status,
                newsCollected: event.newsCollected ?? 0,
                newVendorsCreated: event.newVendorsCreated ?? 0,
                vendorsUpdated: event.vendorsUpdated ?? 0,
                totalDurationMs: event.totalDurationMs ?? 0,
              });
            }
          } catch { /* skip */ }
        }
      }

      // Re-fetch dashboard data after refresh
      await fetchData();
    } catch (err) {
      console.error("[Refresh]", err);
    } finally {
      setIsRefreshing(false);
      setRefreshProgress(null);
    }
  }, [isRefreshing, fetchData]);

  // Auto-dismiss result
  useEffect(() => {
    if (!refreshResult) return;
    const t = setTimeout(() => setRefreshResult(null), 12000);
    return () => clearTimeout(t);
  }, [refreshResult]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const stats = data?.stats;

  return (
    <div className="-mx-4 -mt-6 lg:-mx-8">
      {/* ─── Hero Section ─────────────────────────────────── */}
      <HeroSection
        stats={stats}
        isRefreshing={isRefreshing}
        refreshProgress={refreshProgress}
        refreshResult={refreshResult}
        onRefresh={handleRefresh}
        onDismissResult={() => setRefreshResult(null)}
      />

      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-12 lg:px-8">
        {/* ─── Category Grid ──────────────────────────────── */}
        <section>
          <SectionHeader
            title="Platform Categories"
            subtitle="12 categories powering modern data infrastructure"
            href="/categories/cloud-data-warehouses"
          />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {(data?.categories ?? []).map((cat) => (
              <CategoryCardComponent key={cat.id} category={cat} />
            ))}
          </motion.div>
        </section>

        {/* ─── News Highlights ────────────────────────────── */}
        {(data?.news ?? []).length > 0 && (
          <section>
            <SectionHeader
              title="News Highlights"
              subtitle="Latest industry intelligence"
              href="/news"
            />
            <NewsCarousel news={data?.news ?? []} />
          </section>
        )}

        {/* ─── Two-column: Agent Activity + Quick Actions ─── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Agent Activity Feed */}
          <motion.section variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <SectionHeader title="Agent Activity" subtitle="Recent AI agent runs" />
            <AgentActivityFeed runs={data?.agentRuns ?? []} />
          </motion.section>

          {/* Quick Actions */}
          <motion.section variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <SectionHeader title="Quick Actions" subtitle="Jump into common tasks" />
            <QuickActions />
          </motion.section>
        </div>
      </div>
    </div>
  );
}

// ─── Hero Section ───────────────────────────────────────────────

function HeroSection({
  stats,
  isRefreshing,
  refreshProgress,
  refreshResult,
  onRefresh,
  onDismissResult,
}: {
  stats: DashboardStats | undefined;
  isRefreshing: boolean;
  refreshProgress: { step: number; totalSteps: number; name: string } | null;
  refreshResult: {
    status: string;
    newsCollected: number;
    newVendorsCreated: number;
    vendorsUpdated: number;
    totalDurationMs: number;
  } | null;
  onRefresh: () => void;
  onDismissResult: () => void;
}) {
  return (
    <div className="hero-gradient relative overflow-hidden px-4 pb-12 pt-10 lg:px-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-blue/5 blur-3xl" />
        <div className="hero-grid absolute inset-0" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Title + Refresh */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                Center of Excellence
              </span>
            </div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              NICE Data Platform
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-navy-300">
              Unified intelligence hub for evaluating, comparing, and selecting
              the best data platform technologies across 12 categories.
            </p>
          </motion.div>

          {/* Refresh All Data button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative flex-shrink-0"
          >
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-6 py-3 text-sm font-semibold shadow-lg",
                "transition-all duration-300",
                isRefreshing
                  ? "cursor-not-allowed bg-white/10 text-white/70 backdrop-blur"
                  : "refresh-pulse bg-gradient-to-r from-accent to-blue text-white hover:shadow-accent/25 hover:shadow-xl"
              )}
            >
              <RefreshCw
                size={18}
                className={cn(
                  "transition-transform duration-700",
                  isRefreshing && "animate-spin"
                )}
              />
              {isRefreshing && refreshProgress ? (
                <span>
                  Step {refreshProgress.step}/{refreshProgress.totalSteps}:{" "}
                  {refreshProgress.name}
                </span>
              ) : (
                <span>Refresh All Data</span>
              )}
            </button>

            {/* Progress bar */}
            {isRefreshing && refreshProgress && (
              <div className="absolute -bottom-2 left-0 right-0 h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(refreshProgress.step / refreshProgress.totalSteps) * 100}%`,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}

            {/* Result summary popup */}
            <AnimatePresence>
              {refreshResult && !isRefreshing && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-full z-50 mt-3 w-72 rounded-xl border border-white/10 bg-dark/90 p-4 shadow-2xl backdrop-blur"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        refreshResult.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : refreshResult.status === "partial"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {refreshResult.status}
                    </span>
                    <button onClick={onDismissResult} className="text-white/30 hover:text-white/60">
                      <span className="text-xs">Dismiss</span>
                    </button>
                  </div>
                  <div className="space-y-1 text-[11px] text-white/60">
                    {refreshResult.newsCollected > 0 && (
                      <p><span className="font-semibold text-white">{refreshResult.newsCollected}</span> news articles</p>
                    )}
                    {refreshResult.newVendorsCreated > 0 && (
                      <p><span className="font-semibold text-white">{refreshResult.newVendorsCreated}</span> new vendors</p>
                    )}
                    {refreshResult.vendorsUpdated > 0 && (
                      <p><span className="font-semibold text-white">{refreshResult.vendorsUpdated}</span> vendors updated</p>
                    )}
                    <p className="pt-1 text-[10px] text-white/30">
                      {(refreshResult.totalDurationMs / 1000).toFixed(1)}s total
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Animated stat counters */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <StatCounter label="Vendors Tracked" value={stats?.vendors ?? 0} icon={Building2} />
          <StatCounter label="Categories" value={stats?.categories ?? 0} icon={Layers} />
          <StatCounter label="Benchmarks" value={stats?.benchmarks ?? 0} icon={Trophy} />
          <StatCounter label="Data Points" value={stats?.dataPoints ?? 0} icon={Activity} suffix="+" />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Animated Counter ───────────────────────────────────────────

function StatCounter({
  label,
  value,
  icon: Icon,
  suffix = "",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || value === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animateCount(value, 1200, setCount);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      className="rounded-xl border border-white/5 bg-white/5 px-5 py-4 backdrop-blur"
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon size={14} className="text-accent" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          {label}
        </span>
      </div>
      <p className="font-heading text-2xl font-extrabold text-white sm:text-3xl">
        {count.toLocaleString()}
        {suffix}
      </p>
    </motion.div>
  );
}

function animateCount(
  target: number,
  duration: number,
  setter: (v: number) => void
) {
  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    setter(Math.round(eased * target));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ─── Section Header ─────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <h2 className="text-lg font-bold text-navy">{title}</h2>
        <p className="text-xs text-navy-400">{subtitle}</p>
      </div>
      {href && (
        <Link
          href={href}
          className="nav-transition flex items-center gap-1 text-xs font-medium text-blue hover:text-blue-700"
        >
          View all <ChevronRight size={12} />
        </Link>
      )}
    </div>
  );
}

// ─── Category Card ──────────────────────────────────────────────

function CategoryCardComponent({ category }: { category: CategoryCard }) {
  const Icon = CATEGORY_ICONS[category.slug] ?? Database;
  const gradient = CATEGORY_GRADIENTS[category.slug] ?? "from-blue-500 to-blue-700";

  const healthColor = {
    fresh: "bg-emerald-400",
    aging: "bg-amber-400",
    stale: "bg-red-400",
  }[category.health];

  const healthLabel = {
    fresh: "Up to date",
    aging: "Needs review",
    stale: "Stale data",
  }[category.health];

  return (
    <motion.div variants={cardVariants}>
      <Link
        href={`/categories/${category.slug}`}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm",
          "nav-transition hover:border-blue/20 hover:shadow-md hover:-translate-y-0.5"
        )}
      >
        {/* Gradient accent bar */}
        <div className={cn("h-1 w-full bg-gradient-to-r", gradient)} />

        <div className="flex flex-1 flex-col p-4">
          {/* Icon + health dot */}
          <div className="mb-3 flex items-center justify-between">
            <div className={cn("rounded-lg bg-gradient-to-br p-2 text-white", gradient)}>
              <Icon size={16} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", healthColor)} title={healthLabel} />
              <span className="text-[9px] text-navy-300">{healthLabel}</span>
            </div>
          </div>

          {/* Name + count */}
          <h3 className="text-sm font-semibold text-navy group-hover:text-blue">
            {category.name}
          </h3>
          <p className="mt-0.5 text-[11px] text-navy-400">
            {category.vendorCount} vendor{category.vendorCount !== 1 ? "s" : ""}
          </p>

          {/* Top vendor */}
          {category.topVendor && (
            <div className="mt-auto pt-3">
              <div className="flex items-center justify-between rounded-lg bg-navy-50/60 px-2.5 py-1.5">
                <span className="truncate text-[11px] font-medium text-navy-600">
                  {category.topVendor.name}
                </span>
                {category.topVendor.score != null && (
                  <span className="ml-2 flex-shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue">
                    {Math.round(category.topVendor.score)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── News Carousel ──────────────────────────────────────────────

function NewsCarousel({ news }: { news: NewsItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  const sentimentBadge = (s: string) => {
    if (s === "positive") return "bg-emerald-50 text-emerald-600";
    if (s === "negative") return "bg-red-50 text-red-600";
    return "bg-navy-50 text-navy-500";
  };

  const categoryLabel = (c: string) =>
    c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="relative">
      {/* Scroll buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-navy-100 bg-white p-2 shadow-md hover:shadow-lg"
        >
          <ChevronLeft size={16} className="text-navy" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-navy-100 bg-white p-2 shadow-md hover:shadow-lg"
        >
          <ChevronRight size={16} className="text-navy" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
      >
        {news.map((item, i) => (
          <motion.a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "group flex min-w-[300px] max-w-[300px] flex-shrink-0 flex-col rounded-xl border border-navy-100 bg-white p-4 shadow-sm",
              "nav-transition hover:border-blue/20 hover:shadow-md"
            )}
          >
            {/* Category + Sentiment */}
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold uppercase text-blue">
                {categoryLabel(item.newsCategory)}
              </span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize",
                  sentimentBadge(item.sentiment)
                )}
              >
                {item.sentiment}
              </span>
            </div>

            {/* Title */}
            <h3 className="line-clamp-2 text-sm font-semibold text-navy group-hover:text-blue">
              {item.title}
            </h3>

            {/* Summary */}
            {item.summary && (
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-navy-400">
                {item.summary}
              </p>
            )}

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between pt-3">
              <span className="text-[10px] text-navy-300">
                {item.source ?? "Unknown"} · {timeAgo(item.publishedAt)}
              </span>
              <ExternalLink
                size={10}
                className="text-navy-200 group-hover:text-blue"
              />
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}

// ─── Agent Activity Feed ────────────────────────────────────────

function AgentActivityFeed({ runs }: { runs: AgentRun[] }) {
  const agentLabels: Record<string, string> = {
    "news-collector": "News Collector",
    "vendor-scout": "Vendor Scout",
    "data-refresh-engine": "Data Refresh Engine",
    "vendor-research": "Vendor Research",
    "scoring-agent": "Scoring Agent",
    "pricing-agent": "Pricing Agent",
  };

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 size={14} className="text-emerald-500" />;
    if (status === "failed") return <XCircle size={14} className="text-red-500" />;
    return <Clock size={14} className="animate-spin text-blue" />;
  };

  if (runs.length === 0) {
    return (
      <div className="rounded-xl border border-navy-100 bg-white p-8 text-center shadow-sm">
        <Bot className="mx-auto h-8 w-8 text-navy-200" />
        <p className="mt-2 text-sm text-navy-400">No agent activity yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
      <div className="divide-y divide-navy-50">
        {runs.map((run) => (
          <div
            key={run.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            {statusIcon(run.status)}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-navy">
                {agentLabels[run.agent] ?? run.agent}
              </p>
              <p className="text-[10px] text-navy-400">
                {run.itemsFound > 0 && `${run.itemsFound} items · `}
                {run.durationMs != null && `${(run.durationMs / 1000).toFixed(1)}s · `}
                {timeAgo(run.startedAt)}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-semibold capitalize",
                run.status === "completed"
                  ? "bg-emerald-50 text-emerald-600"
                  : run.status === "failed"
                    ? "bg-red-50 text-red-600"
                    : "bg-blue-50 text-blue"
              )}
            >
              {run.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quick Actions ──────────────────────────────────────────────

const quickActions = [
  {
    href: "/vendors",
    label: "Explore Vendors",
    description: "Browse and compare 150+ data platform vendors",
    icon: Building2,
    gradient: "from-blue to-blue-700",
  },
  {
    href: "/rankings",
    label: "View Rankings",
    description: "See how vendors stack up across categories",
    icon: Trophy,
    gradient: "from-accent to-accent-700",
  },
  {
    href: "/pricing",
    label: "Calculate Pricing",
    description: "Estimate TCO for your workload profile",
    icon: Calculator,
    gradient: "from-emerald-500 to-emerald-700",
  },
  {
    href: "/evaluations",
    label: "Start Evaluation",
    description: "Create a structured vendor evaluation",
    icon: ClipboardCheck,
    gradient: "from-violet-500 to-violet-700",
  },
  {
    href: "/assistant",
    label: "Ask AI Assistant",
    description: "Get recommendations powered by platform intelligence",
    icon: MessageSquare,
    gradient: "from-fuchsia-500 to-fuchsia-700",
  },
  {
    href: "/news",
    label: "Read News",
    description: "Latest industry intelligence and vendor updates",
    icon: Newspaper,
    gradient: "from-amber-500 to-amber-700",
  },
];

function QuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {quickActions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={cn(
            "group flex items-start gap-3 rounded-xl border border-navy-100 bg-white p-4 shadow-sm",
            "nav-transition hover:border-blue/20 hover:shadow-md hover:-translate-y-0.5"
          )}
        >
          <div
            className={cn(
              "rounded-lg bg-gradient-to-br p-2 text-white",
              action.gradient
            )}
          >
            <action.icon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy group-hover:text-blue">
              {action.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-navy-400">
              {action.description}
            </p>
          </div>
          <ChevronRight
            size={14}
            className="mt-1 flex-shrink-0 text-navy-200 transition-transform group-hover:translate-x-0.5 group-hover:text-blue"
          />
        </Link>
      ))}
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="-mx-4 -mt-6 lg:-mx-8">
      {/* Hero skeleton */}
      <div className="hero-gradient px-4 pb-12 pt-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="mt-3 h-9 w-72 rounded bg-white/10" />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-12 pt-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl border border-navy-100 bg-white animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
