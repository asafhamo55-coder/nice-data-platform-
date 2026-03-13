"use client";

import Link from "next/link";
import { Package, Layers, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorData } from "./vendor-hub";
import { VendorInitials } from "./vendor-hub";
import { ScoreGauge } from "./score-gauge";

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  commercial: { label: "Commercial", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  "open-source": { label: "Open Source", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "open-core": { label: "Open Core", cls: "bg-violet-50 text-violet-700 border-violet-200" },
};

interface VendorGridProps {
  vendors: VendorData[];
  compareIds: Set<string>;
  onToggleCompare: (id: string) => void;
}

export function VendorGrid({
  vendors,
  compareIds,
  onToggleCompare,
}: VendorGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {vendors.map((v) => {
        const isComparing = compareIds.has(v.id);
        const typeBadge = TYPE_BADGE[v.type] ?? TYPE_BADGE.commercial;

        return (
          <div
            key={v.id}
            className={cn(
              "nav-transition group relative flex flex-col rounded-xl border bg-white shadow-sm hover:shadow-md",
              isComparing
                ? "border-accent ring-2 ring-accent/20"
                : "border-navy-100 hover:border-navy-200"
            )}
          >
            {/* Compare checkbox */}
            <label className="absolute left-3 top-3 z-10 flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isComparing}
                onChange={() => onToggleCompare(v.id)}
                className="nav-transition h-4 w-4 cursor-pointer rounded border-navy-200 text-accent focus:ring-accent/30"
              />
            </label>

            {/* Card body */}
            <div className="flex flex-1 flex-col p-5 pt-4">
              {/* Top row: logo + score */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 pl-6">
                  <VendorInitials name={v.name} size="md" />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-navy">
                      {v.name}
                    </h3>
                    <span
                      className={cn(
                        "mt-0.5 inline-block rounded-full border px-2 py-px text-[10px] font-medium",
                        typeBadge.cls
                      )}
                    >
                      {typeBadge.label}
                    </span>
                  </div>
                </div>
                <ScoreGauge score={v.overallScore} size={52} strokeWidth={3.5} />
              </div>

              {/* Category badge */}
              {v.primaryCategory && (
                <div className="mt-3.5">
                  <span
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{
                      backgroundColor: v.primaryCategory.color ?? "#5476a9",
                    }}
                  >
                    {v.primaryCategory.name}
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="mt-3 flex items-center gap-4 text-[11px] text-navy-400">
                <span className="flex items-center gap-1">
                  <Package size={12} />
                  {v.productCount} product{v.productCount !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Layers size={12} />
                  {v.categoryCount} categor{v.categoryCount !== 1 ? "ies" : "y"}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center border-t border-navy-50 px-5 py-2.5">
              <Link
                href={`/vendors/${v.slug}`}
                className="nav-transition text-xs font-medium text-blue hover:text-blue-700"
              >
                View details
              </Link>
              {v.website && (
                <a
                  href={v.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-transition ml-auto flex items-center gap-1 text-[11px] text-navy-300 hover:text-navy-500"
                >
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
