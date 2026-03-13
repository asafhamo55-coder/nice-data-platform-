"use client";

import { useMemo } from "react";
import { Check, X as XIcon, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryVendor } from "./category-detail";

interface FeatureMatrixProps {
  vendors: CategoryVendor[];
  color: string;
}

export function FeatureMatrix({ vendors, color }: FeatureMatrixProps) {
  // Build a unified capability list across all vendors
  const { capKeys, matrix } = useMemo(() => {
    // Collect all unique capability keys with their display names
    const capMap = new Map<string, string>();
    vendors.forEach((v) => {
      v.capabilities.forEach((c) => {
        if (!capMap.has(c.key)) {
          capMap.set(c.key, c.name);
        }
      });
    });

    // Sort by frequency (most common first), then alphabetically
    const capFrequency = new Map<string, number>();
    vendors.forEach((v) => {
      v.capabilities.forEach((c) => {
        capFrequency.set(c.key, (capFrequency.get(c.key) ?? 0) + 1);
      });
    });

    const sorted = [...capMap.entries()].sort((a, b) => {
      const freqDiff = (capFrequency.get(b[0]) ?? 0) - (capFrequency.get(a[0]) ?? 0);
      if (freqDiff !== 0) return freqDiff;
      return a[1].localeCompare(b[1]);
    });

    // Limit to top 20 for readability
    const topCaps = sorted.slice(0, 20);

    // Build matrix: for each vendor × capability, determine status
    const matrix = vendors.map((v) => {
      const vendorCaps = new Map(v.capabilities.map((c) => [c.key, c]));
      return {
        vendor: v,
        cells: topCaps.map(([key]) => {
          const cap = vendorCaps.get(key);
          if (!cap) return { status: "missing" as const, rating: null };
          if (cap.rating !== null && cap.rating > 0) {
            return { status: "rated" as const, rating: Math.round(cap.rating * 5) / 10 }; // normalize 0-10 → 0-5
          }
          return { status: "has" as const, rating: null };
        }),
      };
    });

    return { capKeys: topCaps, matrix };
  }, [vendors]);

  if (capKeys.length === 0) {
    return null;
  }

  // Show max 8 vendors side by side
  const displayVendors = matrix.slice(0, 8);

  return (
    <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-navy-100 px-6 py-4">
        <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
          <rect x="11" y="1" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
          <rect x="1" y="11" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
          <rect x="11" y="11" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        </svg>
        <h2 className="text-lg font-semibold text-navy">Feature Matrix</h2>
        <span className="ml-auto text-[11px] text-navy-300">
          {capKeys.length} capabilities · {displayVendors.length} vendors
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50/60">
              <th className="sticky left-0 z-10 min-w-[180px] bg-navy-50/95 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                Capability
              </th>
              {displayVendors.map(({ vendor }) => (
                <th
                  key={vendor.id}
                  className="min-w-[90px] px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-navy-400"
                >
                  <div className="truncate" title={vendor.name}>
                    {vendor.name.length > 12 ? vendor.name.slice(0, 10) + "…" : vendor.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {capKeys.map(([key, name], rowIdx) => (
              <tr
                key={key}
                className={cn(
                  "border-b border-navy-50",
                  rowIdx % 2 === 0 && "bg-navy-50/20"
                )}
              >
                <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-medium text-navy-500">
                  <span className="capitalize">{name.replace(/-/g, " ")}</span>
                </td>
                {displayVendors.map(({ vendor, cells }) => {
                  const cell = cells[rowIdx];
                  return (
                    <td key={vendor.id} className="px-2 py-2.5 text-center">
                      {cell.status === "has" && (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50">
                          <Check size={12} className="text-emerald-600" />
                        </span>
                      )}
                      {cell.status === "rated" && (
                        <span
                          className={cn(
                            "inline-block rounded px-1.5 py-0.5 text-[10px] font-bold",
                            cell.rating! >= 4
                              ? "bg-emerald-50 text-emerald-700"
                              : cell.rating! >= 3
                                ? "bg-blue-50 text-blue-700"
                                : cell.rating! >= 2
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-600"
                          )}
                        >
                          {cell.rating!.toFixed(1)}
                        </span>
                      )}
                      {cell.status === "missing" && (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-50">
                          <XIcon size={10} className="text-red-300" />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t border-navy-50 px-6 py-3">
        <span className="text-[10px] font-medium text-navy-400">Legend:</span>
        <span className="inline-flex items-center gap-1 text-[10px] text-navy-400">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50">
            <Check size={10} className="text-emerald-600" />
          </span>
          Available
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-navy-400">
          <span className="inline-block rounded bg-blue-50 px-1 py-px text-[9px] font-bold text-blue-700">3.5</span>
          Rated (1-5)
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-navy-400">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-50">
            <XIcon size={8} className="text-red-300" />
          </span>
          Missing
        </span>
      </div>
    </div>
  );
}
