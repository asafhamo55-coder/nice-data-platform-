"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorData } from "./vendor-hub";
import { VendorInitials } from "./vendor-hub";
import { ScoreGauge } from "./score-gauge";

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  commercial: { label: "Commercial", cls: "bg-blue-50 text-blue-700" },
  "open-source": { label: "Open Source", cls: "bg-emerald-50 text-emerald-700" },
  "open-core": { label: "Open Core", cls: "bg-violet-50 text-violet-700" },
};

type SortField = "name" | "type" | "overallScore" | "primaryCategory" | "productCount" | "pricingModel";
type SortDir = "asc" | "desc";

interface VendorDataTableProps {
  vendors: VendorData[];
  compareIds: Set<string>;
  onToggleCompare: (id: string) => void;
}

const columns: { key: SortField; label: string; align?: "right" | "center" }[] = [
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "overallScore", label: "Score", align: "center" },
  { key: "primaryCategory", label: "Primary Category" },
  { key: "productCount", label: "Products", align: "center" },
  { key: "pricingModel", label: "Pricing" },
];

export function VendorDataTable({
  vendors,
  compareIds,
  onToggleCompare,
}: VendorDataTableProps) {
  const [sortField, setSortField] = useState<SortField>("overallScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" || field === "type" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    const arr = [...vendors];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "overallScore":
          cmp = a.overallScore - b.overallScore;
          break;
        case "primaryCategory":
          cmp = (a.primaryCategory?.name ?? "").localeCompare(b.primaryCategory?.name ?? "");
          break;
        case "productCount":
          cmp = a.productCount - b.productCount;
          break;
        case "pricingModel":
          cmp = a.pricingModel.localeCompare(b.pricingModel);
          break;
      }
      return cmp * dir;
    });
    return arr;
  }, [vendors, sortField, sortDir]);

  return (
    <div className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50/60">
              {/* Compare column */}
              <th className="w-10 px-3 py-3" />
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "cursor-pointer select-none whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-navy-400 hover:text-navy",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortField === col.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp size={12} className="text-blue" />
                      ) : (
                        <ArrowDown size={12} className="text-blue" />
                      )
                    ) : (
                      <ArrowUpDown size={12} className="opacity-30" />
                    )}
                  </span>
                </th>
              ))}
              {/* Actions */}
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((v, i) => {
              const isComparing = compareIds.has(v.id);
              const badge = TYPE_BADGE[v.type] ?? TYPE_BADGE.commercial;

              return (
                <tr
                  key={v.id}
                  className={cn(
                    "nav-transition border-b border-navy-50 hover:bg-navy-50/40",
                    isComparing && "bg-accent-50/30"
                  )}
                >
                  {/* Compare checkbox */}
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={isComparing}
                      onChange={() => onToggleCompare(v.id)}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-navy-200 text-accent focus:ring-accent/30"
                    />
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <VendorInitials name={v.name} size="sm" />
                      <div>
                        <Link
                          href={`/vendors/${v.slug}`}
                          className="font-medium text-navy hover:text-blue"
                        >
                          {v.name}
                        </Link>
                        {v.hqLocation && (
                          <p className="text-[11px] text-navy-300">
                            {v.hqLocation}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                        badge.cls
                      )}
                    >
                      {badge.label}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex">
                      <ScoreGauge score={v.overallScore} size={38} strokeWidth={3} />
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    {v.primaryCategory && (
                      <span
                        className="inline-block rounded-md px-2 py-0.5 text-[10px] font-medium text-white"
                        style={{ backgroundColor: v.primaryCategory.color ?? "#5476a9" }}
                      >
                        {v.primaryCategory.name}
                      </span>
                    )}
                  </td>

                  {/* Products */}
                  <td className="px-4 py-3 text-center text-navy-500">
                    {v.productCount}
                  </td>

                  {/* Pricing */}
                  <td className="px-4 py-3">
                    <span className="capitalize text-navy-500">
                      {v.pricingModel.replace("-", " ")}
                    </span>
                  </td>

                  {/* View */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/vendors/${v.slug}`}
                      className="nav-transition rounded-md border border-navy-100 px-3 py-1 text-xs font-medium text-navy-500 hover:border-blue hover:text-blue"
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
