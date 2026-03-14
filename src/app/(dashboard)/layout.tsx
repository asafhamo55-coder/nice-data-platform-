"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Trophy,
  Calculator,
  Newspaper,
  ClipboardCheck,
  MessageSquare,
  BookOpen,
  ChevronDown,
  Search,
  RefreshCw,
  Menu,
  X,
  Bell,
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
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";

// ─── Category sub-items for collapsible section ──────────────

const categoryItems = [
  { slug: "cloud-data-warehouses", label: "Cloud Data Warehouses", icon: Database },
  { slug: "etl-data-integration", label: "ETL & Integration", icon: Workflow },
  { slug: "bi-analytics", label: "BI & Analytics", icon: BarChart3 },
  { slug: "data-governance", label: "Data Governance", icon: Shield },
  { slug: "ai-ml-platforms", label: "AI/ML Platforms", icon: Brain },
  { slug: "data-quality", label: "Data Quality", icon: Zap },
  { slug: "stream-processing", label: "Stream Processing", icon: Cpu },
  { slug: "data-lakes", label: "Data Lakes & Lakehouse", icon: Server },
  { slug: "api-management", label: "API Management", icon: Globe },
  { slug: "data-security", label: "Data Security", icon: Lock },
  { slug: "cloud-platforms", label: "Cloud Platforms", icon: Cloud },
  { slug: "reverse-etl", label: "Reverse ETL", icon: Layers },
];

// ─── Main nav items ──────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendors", label: "Vendor Hub", icon: Building2, badge: 98 },
  { href: "/rankings", label: "Global Rankings", icon: Trophy },
  { href: "/pricing", label: "Pricing Calculator", icon: Calculator },
  { href: "/news", label: "News Feed", icon: Newspaper, badge: 5 },
  { href: "/evaluations", label: "Evaluations", icon: ClipboardCheck },
  { href: "/assistant", label: "AI Assistant", icon: MessageSquare },
  { href: "/standards", label: "Standards", icon: BookOpen },
];

// ─── Sidebar content (shared between desktop & mobile) ───────

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const [categoriesOpen, setCategoriesOpen] = useState(
    pathname.startsWith("/categories")
  );

  const isNavActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleClick = () => onNavigate?.();

  return (
    <div className="flex h-full flex-col">
      {/* ─── Logo ─────────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/" className="group flex items-baseline gap-1" onClick={handleClick}>
          <span className="font-heading text-[22px] font-extrabold tracking-tight text-white">
            NICE
          </span>
          <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
            DP-CoE
          </span>
        </Link>
      </div>

      {/* ─── Divider ──────────────────────────────────── */}
      <div className="mx-4 border-t border-sidebar-border" />

      {/* ─── Navigation ───────────────────────────────── */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
        {/* Primary items (Dashboard, Vendor Hub) */}
        <ul className="space-y-0.5">
          {mainNavItems.slice(0, 2).map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isNavActive(item.href)}
              onClick={handleClick}
            />
          ))}
        </ul>

        {/* ─── Categories (collapsible) ───────────────── */}
        <div className="mt-1">
          <button
            onClick={() => setCategoriesOpen(!categoriesOpen)}
            className={cn(
              "nav-transition group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium",
              pathname.startsWith("/categories")
                ? "nav-active-gradient text-white"
                : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
            )}
          >
            {/* Active accent bar */}
            {pathname.startsWith("/categories") && (
              <span className="absolute left-0 h-6 w-[3px] rounded-r-full bg-accent" />
            )}
            <Layers size={18} className="shrink-0" />
            <span className="flex-1 text-left">Categories</span>
            <span className="mr-0.5 rounded-full bg-sidebar-hover px-1.5 py-0.5 text-[10px] font-semibold text-accent-300">
              12
            </span>
            <ChevronDown
              size={14}
              className={cn(
                "nav-transition shrink-0 text-sidebar-muted",
                categoriesOpen && "rotate-180"
              )}
            />
          </button>

          {/* Category sub-items */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-200 ease-in-out",
              categoriesOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <ul className="ml-3 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
              {categoryItems.map((cat) => {
                const href = `/categories/${cat.slug}`;
                const active = pathname === href;
                return (
                  <li key={cat.slug}>
                    <Link
                      href={href}
                      onClick={handleClick}
                      className={cn(
                        "nav-transition flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[12px]",
                        active
                          ? "bg-sidebar-active text-accent font-medium"
                          : "text-sidebar-muted hover:bg-sidebar-hover hover:text-navy-200"
                      )}
                    >
                      <cat.icon size={14} className="shrink-0" />
                      <span className="truncate">{cat.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Remaining nav items */}
        <ul className="mt-0.5 space-y-0.5">
          {mainNavItems.slice(2).map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isNavActive(item.href)}
              onClick={handleClick}
            />
          ))}
        </ul>
      </nav>

      {/* ─── Sidebar footer: Agent status ─────────────── */}
      <div className="mx-3 border-t border-sidebar-border" />
      <div className="shrink-0 px-4 py-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-hover px-3 py-2.5">
          <span className="relative flex h-2 w-2">
            <span className="agent-pulse absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-navy-200">AI Agents</p>
            <p className="text-[10px] text-sidebar-muted">5 agents online</p>
          </div>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}

// ─── Individual nav link component ───────────────────────────

function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <li className="relative">
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          "nav-transition flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium",
          isActive
            ? "nav-active-gradient text-white"
            : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
        )}
      >
        {/* Cyan accent bar for active state */}
        {isActive && (
          <span className="absolute left-0 h-6 w-[3px] rounded-r-full bg-accent" />
        )}
        <item.icon size={18} className="shrink-0" />
        <span className="flex-1">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              isActive
                ? "bg-accent/20 text-accent-200"
                : "bg-sidebar-hover text-sidebar-muted"
            )}
          >
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}

// ─── Refresh progress types ─────────────────────────────────

interface RefreshProgress {
  step: number;
  totalSteps: number;
  name: string;
  status: string;
  detail?: string;
}

interface RefreshResult {
  status: "completed" | "partial" | "failed";
  newsCollected: number;
  newVendorsCreated: number;
  vendorsUpdated: number;
  qualityIssues: { vendorName: string; detail: string }[];
  totalDurationMs: number;
}

// ─── Top Header ──────────────────────────────────────────────

function TopHeader({
  onMenuOpen,
  isRefreshing,
  refreshProgress,
  refreshResult,
  onRefresh,
  onDismissResult,
}: {
  onMenuOpen: () => void;
  isRefreshing: boolean;
  refreshProgress: RefreshProgress | null;
  refreshResult: RefreshResult | null;
  onRefresh: () => void;
  onDismissResult: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const openSearch = useCallback(() => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  }, []);

  return (
    <header className="relative flex h-16 shrink-0 items-center gap-4 border-b border-navy-100 bg-white px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuOpen}
        className="nav-transition rounded-lg p-2 text-navy-400 hover:bg-navy-50 hover:text-navy lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Search trigger (opens Cmd+K palette) */}
      <button
        onClick={openSearch}
        className="nav-transition flex flex-1 max-w-xl items-center gap-2 rounded-lg border border-navy-100 bg-navy-50/50 px-3 py-2 text-sm text-navy-300 hover:border-blue hover:text-navy-400"
      >
        <Search size={16} className="flex-shrink-0" />
        <span className="flex-1 text-left hidden sm:inline">Search vendors, categories, or metrics...</span>
        <span className="flex-1 text-left sm:hidden">Search...</span>
        <kbd className="hidden rounded border border-navy-200 bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-navy-400 sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Refresh Data */}
        <div className="relative">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "nav-transition flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
              isRefreshing
                ? "cursor-not-allowed border-blue/30 bg-blue-50 text-blue"
                : "border-navy-100 text-navy-500 hover:border-blue hover:text-blue"
            )}
          >
            <RefreshCw
              size={14}
              className={cn(isRefreshing && "animate-spin")}
            />
            {isRefreshing && refreshProgress ? (
              <span className="hidden sm:inline">
                {refreshProgress.step}/{refreshProgress.totalSteps}{" "}
                {refreshProgress.name}
              </span>
            ) : (
              <span className="hidden sm:inline">Refresh Data</span>
            )}
          </button>

          {/* Progress bar under the button */}
          {isRefreshing && refreshProgress && (
            <div className="absolute -bottom-1 left-0 right-0 h-0.5 overflow-hidden rounded-full bg-navy-100">
              <div
                className="nav-transition h-full rounded-full bg-blue"
                style={{
                  width: `${(refreshProgress.step / refreshProgress.totalSteps) * 100}%`,
                }}
              />
            </div>
          )}

          {/* Result toast */}
          {refreshResult && !isRefreshing && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-navy-100 bg-white p-4 shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    refreshResult.status === "completed"
                      ? "bg-emerald-50 text-emerald-600"
                      : refreshResult.status === "partial"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-600"
                  )}
                >
                  {refreshResult.status}
                </span>
                <button
                  onClick={onDismissResult}
                  className="rounded p-0.5 text-navy-300 hover:text-navy"
                >
                  <X size={12} />
                </button>
              </div>

              <div className="space-y-1.5 text-[11px] text-navy-500">
                {refreshResult.newsCollected > 0 && (
                  <p>
                    <span className="font-semibold text-navy">{refreshResult.newsCollected}</span> news articles collected
                  </p>
                )}
                {refreshResult.newVendorsCreated > 0 && (
                  <p>
                    <span className="font-semibold text-navy">{refreshResult.newVendorsCreated}</span> new vendors discovered
                  </p>
                )}
                {refreshResult.vendorsUpdated > 0 && (
                  <p>
                    <span className="font-semibold text-navy">{refreshResult.vendorsUpdated}</span> vendors updated
                  </p>
                )}
                {refreshResult.qualityIssues.length > 0 && (
                  <p className="text-amber-600">
                    {refreshResult.qualityIssues.length} quality issues found
                  </p>
                )}
                <p className="pt-1 text-[10px] text-navy-300">
                  Completed in {(refreshResult.totalDurationMs / 1000).toFixed(1)}s
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dark mode toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="nav-transition rounded-lg p-2 text-navy-400 hover:bg-navy-50 hover:text-navy"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}

        {/* Notifications */}
        <button className="nav-transition relative rounded-lg p-2 text-navy-400 hover:bg-navy-50 hover:text-navy">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
        </button>

        {/* User avatar */}
        <button className="nav-transition ml-1 flex items-center gap-2 rounded-lg p-1.5 hover:bg-navy-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue to-accent text-xs font-bold text-white">
            NC
          </div>
          <div className="hidden text-left md:block">
            <p className="text-xs font-semibold text-navy">NICE Admin</p>
            <p className="text-[10px] text-navy-400">admin@nice.com</p>
          </div>
          <ChevronDown size={14} className="hidden text-navy-400 md:block" />
        </button>
      </div>
    </header>
  );
}

// ─── Mobile sidebar overlay ──────────────────────────────────

function MobileSidebar({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setAnimating(true);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleClose = useCallback(() => {
    const el = sidebarRef.current;
    if (el) {
      el.classList.remove("sidebar-enter");
      el.classList.add("sidebar-exit");
      setTimeout(() => {
        setAnimating(false);
        onClose();
      }, 200);
    } else {
      onClose();
    }
  }, [onClose]);

  if (!open && !animating) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="backdrop-enter absolute inset-0 bg-dark/60"
        onClick={handleClose}
      />
      {/* Sidebar panel */}
      <div
        ref={sidebarRef}
        className="sidebar-enter absolute inset-y-0 left-0 w-72 bg-sidebar shadow-2xl"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-4 rounded-lg p-1.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
        >
          <X size={18} />
        </button>
        <SidebarContent pathname={pathname} onNavigate={handleClose} />
      </div>
    </div>
  );
}

// ─── Main Dashboard Layout ───────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState<RefreshProgress | null>(null);
  const [refreshResult, setRefreshResult] = useState<RefreshResult | null>(null);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshProgress(null);
    setRefreshResult(null);

    try {
      const res = await fetch("/api/agents/refresh-all", { method: "POST" });
      if (!res.ok) throw new Error("Refresh request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

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
                status: event.status,
                detail: event.detail,
              });
            } else if (event.type === "summary") {
              setRefreshResult({
                status: event.status,
                newsCollected: event.newsCollected ?? 0,
                newVendorsCreated: event.newVendorsCreated ?? 0,
                vendorsUpdated: event.vendorsUpdated ?? 0,
                qualityIssues: event.qualityIssues ?? [],
                totalDurationMs: event.totalDurationMs ?? 0,
              });
            } else if (event.type === "error") {
              console.error("[Refresh] Error:", event.error);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch (err) {
      console.error("[Refresh] Failed:", err);
    } finally {
      setIsRefreshing(false);
      setRefreshProgress(null);
    }
  }, [isRefreshing]);

  const handleDismissResult = useCallback(() => {
    setRefreshResult(null);
  }, []);

  // Auto-dismiss result after 10 seconds
  useEffect(() => {
    if (!refreshResult) return;
    const timer = setTimeout(() => setRefreshResult(null), 10000);
    return () => clearTimeout(timer);
  }, [refreshResult]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-light">
      {/* ─── Desktop Sidebar ──────────────────────────── */}
      <aside className="hidden w-64 shrink-0 bg-sidebar lg:flex lg:flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* ─── Mobile Sidebar ───────────────────────────── */}
      <MobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        pathname={pathname}
      />

      {/* ─── Main area ────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopHeader
          onMenuOpen={() => setMobileMenuOpen(true)}
          isRefreshing={isRefreshing}
          refreshProgress={refreshProgress}
          refreshResult={refreshResult}
          onRefresh={handleRefresh}
          onDismissResult={handleDismissResult}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
