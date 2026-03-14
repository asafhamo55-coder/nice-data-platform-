"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  CheckCircle2,
  XCircle,
  Minus,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────

interface CompareVendor {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  tier: string;
  founded: number | null;
  hqLocation: string | null;
  employeeRange: string | null;
  overallScore: number;
  categories: {
    name: string;
    slug: string;
    isPrimary: boolean;
    score: number | null;
    rank: number | null;
  }[];
  products: {
    name: string;
    pricingModel: string | null;
    pricingUrl: string | null;
    tier: string | null;
  }[];
  radarDimensions: { name: string; value: number }[];
  capabilities: {
    name: string;
    maturity: string;
    rating: number | null;
    product: string;
  }[];
  benchmarks: {
    name: string;
    value: number;
    unit: string | null;
    higherIsBetter: boolean;
  }[];
}

// ─── Color palette for vendors ──────────────────────────────────

const VENDOR_COLORS = [
  { bg: "bg-blue", text: "text-blue", light: "bg-blue-50", border: "border-blue/20", fill: "#2E75B6" },
  { bg: "bg-accent", text: "text-accent", light: "bg-accent-50", border: "border-accent/20", fill: "#00B4D8" },
  { bg: "bg-violet-500", text: "text-violet-600", light: "bg-violet-50", border: "border-violet-200", fill: "#8b5cf6" },
  { bg: "bg-amber-500", text: "text-amber-600", light: "bg-amber-50", border: "border-amber-200", fill: "#f59e0b" },
];

// ─── Main Component ─────────────────────────────────────────────

export function CompareView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [vendors, setVendors] = useState<CompareVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const ids = searchParams.get("ids") ?? "";

  useEffect(() => {
    if (!ids || ids.split(",").filter(Boolean).length < 2) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/vendors/compare?ids=${ids}`);
        if (res.ok) {
          const data = await res.json();
          setVendors(data.vendors);
        }
      } catch (err) {
        console.error("Compare fetch failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [ids]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-navy-100 animate-pulse" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl border border-navy-100 bg-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (vendors.length < 2) {
    return (
      <div className="space-y-6">
        <Link href="/vendors" className="flex items-center gap-2 text-sm text-blue hover:underline">
          <ArrowLeft size={14} /> Back to Vendor Hub
        </Link>
        <div className="rounded-xl border border-navy-100 bg-white p-16 text-center">
          <p className="text-navy-400">Select 2-4 vendors from the Vendor Hub to compare.</p>
        </div>
      </div>
    );
  }

  const colCount = vendors.length;

  // Collect all unique criteria across vendors for feature matrix
  const allCapabilities = useMemo(() => {
    const capSet = new Set<string>();
    vendors.forEach((v) => v.capabilities.forEach((c) => capSet.add(c.name)));
    return [...capSet].sort();
  }, [vendors]);

  // Collect all unique radar dimensions
  const allRadarDimensions = useMemo(() => {
    const dimSet = new Set<string>();
    vendors.forEach((v) => v.radarDimensions.forEach((d) => dimSet.add(d.name)));
    return [...dimSet].sort();
  }, [vendors]);

  // Collect all unique benchmarks
  const allBenchmarks = useMemo(() => {
    const benchSet = new Map<string, { unit: string | null; higherIsBetter: boolean }>();
    vendors.forEach((v) =>
      v.benchmarks.forEach((b) => {
        if (!benchSet.has(b.name)) benchSet.set(b.name, { unit: b.unit, higherIsBetter: b.higherIsBetter });
      })
    );
    return [...benchSet.entries()];
  }, [vendors]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/vendors" className="mb-2 flex items-center gap-1.5 text-xs text-blue hover:underline">
            <ArrowLeft size={12} /> Back to Vendor Hub
          </Link>
          <h1 className="text-2xl font-bold text-navy">
            Vendor Comparison
          </h1>
          <p className="mt-1 text-sm text-navy-400">
            Side-by-side analysis of {vendors.length} vendors
          </p>
        </div>
        <button
          onClick={handleShare}
          className="nav-transition flex items-center gap-2 self-start rounded-lg border border-navy-100 px-3 py-2 text-xs font-medium text-navy-500 hover:border-blue/20 hover:text-blue"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
          {copied ? "Link copied!" : "Share comparison"}
        </button>
      </div>

      {/* Vendor header cards */}
      <div className={cn("grid gap-4", gridCols(colCount))}>
        {vendors.map((v, i) => {
          const color = VENDOR_COLORS[i % VENDOR_COLORS.length];
          return (
            <div key={v.id} className={cn("rounded-xl border bg-white p-5 shadow-sm", color.border)}>
              {/* Score badge */}
              <div className="mb-3 flex items-center justify-between">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", color.light, color.text)}>
                  {v.tier}
                </span>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white", color.bg)}>
                  {v.overallScore}
                </div>
              </div>
              <h3 className="text-base font-bold text-navy">{v.name}</h3>
              {v.description && (
                <p className="mt-1 line-clamp-2 text-[11px] text-navy-400">{v.description}</p>
              )}
              <div className="mt-3 space-y-1 text-[11px] text-navy-500">
                {v.founded && <p>Founded: {v.founded}</p>}
                {v.hqLocation && <p>HQ: {v.hqLocation}</p>}
                {v.employeeRange && <p>Employees: {v.employeeRange}</p>}
              </div>
              {v.website && (
                <a
                  href={v.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-blue hover:underline"
                >
                  Website <ExternalLink size={9} />
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Radar Chart (SVG) */}
      {allRadarDimensions.length >= 3 && (
        <section>
          <h2 className="mb-4 text-sm font-bold text-navy">Score Comparison</h2>
          <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
            <RadarChart
              vendors={vendors}
              dimensions={allRadarDimensions}
            />
            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {vendors.map((v, i) => {
                const color = VENDOR_COLORS[i % VENDOR_COLORS.length];
                return (
                  <div key={v.id} className="flex items-center gap-1.5">
                    <div className={cn("h-2.5 w-2.5 rounded-full", color.bg)} />
                    <span className="text-xs text-navy-500">{v.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Feature / Capability Matrix */}
      {allCapabilities.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-bold text-navy">Feature Matrix</h2>
          <div className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left font-semibold text-navy">Capability</th>
                  {vendors.map((v, i) => (
                    <th key={v.id} className="px-4 py-3 text-center font-semibold text-navy">
                      {v.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allCapabilities.map((capName) => (
                  <tr key={capName} className="border-b border-navy-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-medium text-navy-600">{capName}</td>
                    {vendors.map((v) => {
                      const cap = v.capabilities.find((c) => c.name === capName);
                      return (
                        <td key={v.id} className="px-4 py-2.5 text-center">
                          {cap ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <CapabilityIcon maturity={cap.maturity} />
                              {cap.rating != null && (
                                <span className="text-[10px] text-navy-400">{cap.rating}/10</span>
                              )}
                            </div>
                          ) : (
                            <Minus size={14} className="mx-auto text-navy-200" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Pricing Comparison */}
      <section>
        <h2 className="mb-4 text-sm font-bold text-navy">Pricing Comparison</h2>
        <div className={cn("grid gap-4", gridCols(colCount))}>
          {vendors.map((v, i) => {
            const color = VENDOR_COLORS[i % VENDOR_COLORS.length];
            return (
              <div key={v.id} className={cn("rounded-xl border bg-white p-4 shadow-sm", color.border)}>
                <h3 className="text-sm font-semibold text-navy">{v.name}</h3>
                {v.products.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {v.products.map((p, j) => (
                      <div key={j} className="rounded-lg bg-navy-50/50 p-2.5">
                        <p className="text-xs font-medium text-navy">{p.name}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {p.pricingModel && (
                            <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-navy-500 border border-navy-100">
                              {p.pricingModel}
                            </span>
                          )}
                          {p.tier && (
                            <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-navy-500 border border-navy-100">
                              {p.tier}
                            </span>
                          )}
                        </div>
                        {p.pricingUrl && (
                          <a
                            href={p.pricingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-blue hover:underline"
                          >
                            Pricing page <ExternalLink size={8} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] text-navy-400">No pricing data available</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Benchmark Comparison */}
      {allBenchmarks.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-bold text-navy">Benchmark Results</h2>
          <div className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left font-semibold text-navy">Benchmark</th>
                  {vendors.map((v) => (
                    <th key={v.id} className="px-4 py-3 text-center font-semibold text-navy">{v.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allBenchmarks.map(([name, { unit, higherIsBetter }]) => {
                  const values = vendors.map((v) => v.benchmarks.find((b) => b.name === name)?.value ?? null);
                  const validValues = values.filter((v): v is number => v !== null);
                  const best = validValues.length > 0
                    ? (higherIsBetter ? Math.max(...validValues) : Math.min(...validValues))
                    : null;

                  return (
                    <tr key={name} className="border-b border-navy-50">
                      <td className="sticky left-0 z-10 bg-white px-4 py-2.5">
                        <span className="font-medium text-navy-600">{name}</span>
                        {unit && <span className="ml-1 text-navy-300">({unit})</span>}
                      </td>
                      {vendors.map((v) => {
                        const b = v.benchmarks.find((b) => b.name === name);
                        const isBest = b && b.value === best;
                        return (
                          <td key={v.id} className="px-4 py-2.5 text-center">
                            {b ? (
                              <span className={cn("font-medium", isBest ? "text-emerald-600 font-bold" : "text-navy-600")}>
                                {b.value.toLocaleString()}
                                {isBest && " ★"}
                              </span>
                            ) : (
                              <span className="text-navy-200">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── SVG Radar Chart ────────────────────────────────────────────

function RadarChart({
  vendors,
  dimensions,
}: {
  vendors: CompareVendor[];
  dimensions: string[];
}) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 40;
  const levels = 5;
  const angleStep = (2 * Math.PI) / dimensions.length;

  // Grid rings
  const rings = Array.from({ length: levels }, (_, i) => {
    const r = (maxRadius / levels) * (i + 1);
    const points = dimensions
      .map((_, j) => {
        const angle = angleStep * j - Math.PI / 2;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      })
      .join(" ");
    return points;
  });

  // Axis lines
  const axes = dimensions.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return {
      x: cx + maxRadius * Math.cos(angle),
      y: cy + maxRadius * Math.sin(angle),
      labelX: cx + (maxRadius + 20) * Math.cos(angle),
      labelY: cy + (maxRadius + 20) * Math.sin(angle),
    };
  });

  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-64 w-64 sm:h-80 sm:w-80">
        {/* Grid rings */}
        {rings.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="#d9e0ed"
            strokeWidth={0.5}
            opacity={0.6}
          />
        ))}

        {/* Axis lines */}
        {axes.map((axis, i) => (
          <g key={i}>
            <line x1={cx} y1={cy} x2={axis.x} y2={axis.y} stroke="#d9e0ed" strokeWidth={0.5} />
            <text
              x={axis.labelX}
              y={axis.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-navy-400 text-[8px]"
            >
              {truncateLabel(dimensions[i], 12)}
            </text>
          </g>
        ))}

        {/* Vendor polygons */}
        {vendors.map((v, vi) => {
          const color = VENDOR_COLORS[vi % VENDOR_COLORS.length];
          const points = dimensions
            .map((dim, di) => {
              const dimData = v.radarDimensions.find((d) => d.name === dim);
              const value = dimData ? dimData.value / 10 : 0; // normalize 0-10 to 0-1
              const r = value * maxRadius;
              const angle = angleStep * di - Math.PI / 2;
              return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            })
            .join(" ");

          return (
            <polygon
              key={v.id}
              points={points}
              fill={color.fill}
              fillOpacity={0.12}
              stroke={color.fill}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          );
        })}

        {/* Data points */}
        {vendors.map((v, vi) => {
          const color = VENDOR_COLORS[vi % VENDOR_COLORS.length];
          return dimensions.map((dim, di) => {
            const dimData = v.radarDimensions.find((d) => d.name === dim);
            const value = dimData ? dimData.value / 10 : 0;
            const r = value * maxRadius;
            const angle = angleStep * di - Math.PI / 2;
            return (
              <circle
                key={`${v.id}-${dim}`}
                cx={cx + r * Math.cos(angle)}
                cy={cy + r * Math.sin(angle)}
                r={2.5}
                fill={color.fill}
              />
            );
          });
        })}
      </svg>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function CapabilityIcon({ maturity }: { maturity: string }) {
  if (maturity === "ga" || maturity === "mature") {
    return <CheckCircle2 size={14} className="text-emerald-500" />;
  }
  if (maturity === "preview") {
    return <span className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-medium text-amber-600">Preview</span>;
  }
  if (maturity === "deprecated") {
    return <XCircle size={14} className="text-red-400" />;
  }
  return <CheckCircle2 size={14} className="text-emerald-500" />;
}

function gridCols(count: number): string {
  if (count <= 2) return "grid-cols-1 sm:grid-cols-2";
  if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
}

function truncateLabel(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
