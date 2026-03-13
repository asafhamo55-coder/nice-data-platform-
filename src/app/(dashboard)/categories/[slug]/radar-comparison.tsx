"use client";

import { useState, useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryVendor, CriterionData } from "./category-detail";

interface RadarComparisonChartProps {
  vendors: CategoryVendor[];
  criteria: CriterionData[];
  color: string;
}

const COLORS = ["#2E75B6", "#10b981", "#f59e0b", "#ef4444"];

export function RadarComparisonChart({ vendors, criteria, color }: RadarComparisonChartProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    vendors.slice(0, 2).map((v) => v.id)
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const addVendor = (id: string) => {
    if (selectedIds.length < 4 && !selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev, id]);
    }
    setDropdownOpen(false);
  };

  const removeVendor = (id: string) => {
    if (selectedIds.length > 1) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const selectedVendors = useMemo(
    () => selectedIds.map((id) => vendors.find((v) => v.id === id)).filter(Boolean) as CategoryVendor[],
    [selectedIds, vendors]
  );

  const radarData = useMemo(() => {
    return criteria.map((criterion) => {
      const point: Record<string, string | number> = {
        dimension: criterion.name.length > 16 ? criterion.name.slice(0, 14) + "…" : criterion.name,
        fullName: criterion.name,
      };
      selectedVendors.forEach((v) => {
        const dimScore = v.dimensions.find((d) => d.key === criterion.key)?.score ?? 0;
        point[v.name] = dimScore;
      });
      return point;
    });
  }, [criteria, selectedVendors]);

  const available = vendors.filter((v) => !selectedIds.includes(v.id));

  if (criteria.length === 0 || vendors.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-navy-100 px-6 py-4">
        <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
          <polygon points="9,1 16,6 14,15 4,15 2,6" stroke={color} strokeWidth="1.5" fill="none" />
          <polygon points="9,5 13,8 12,13 6,13 5,8" stroke={color} strokeWidth="1" fill={`${color}20`} />
        </svg>
        <h2 className="text-lg font-semibold text-navy">Radar Comparison</h2>

        {/* Add vendor button */}
        <div className="relative ml-auto">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={selectedIds.length >= 4 || available.length === 0}
            className={cn(
              "nav-transition inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium",
              selectedIds.length >= 4 || available.length === 0
                ? "cursor-not-allowed border-navy-100 text-navy-300"
                : "border-blue-200 text-blue hover:bg-blue-50"
            )}
          >
            <Plus size={12} />
            Add Vendor ({selectedIds.length}/4)
          </button>
          {dropdownOpen && available.length > 0 && (
            <div className="absolute right-0 top-full z-20 mt-1 max-h-60 w-56 overflow-y-auto rounded-lg border border-navy-100 bg-white py-1 shadow-lg">
              {available.map((v) => (
                <button
                  key={v.id}
                  onClick={() => addVendor(v.id)}
                  className="nav-transition flex w-full items-center justify-between px-3 py-2 text-left text-xs text-navy-500 hover:bg-navy-50"
                >
                  <span>{v.name}</span>
                  <span className="text-[10px] font-bold text-navy-300">{v.overallScore}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected vendor pills */}
      <div className="flex flex-wrap gap-2 px-6 pt-4">
        {selectedVendors.map((v, i) => (
          <span
            key={v.id}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor: COLORS[i], color: COLORS[i] }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS[i] }}
            />
            {v.name}
            {selectedIds.length > 1 && (
              <button onClick={() => removeVendor(v.id)} className="hover:opacity-60">
                <X size={10} />
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Radar chart */}
      <div className="flex justify-center px-6 pb-6 pt-2">
        <div className="h-[420px] w-full max-w-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="#e8edf5" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "#5476a9" }} />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#8fa4c4" }}
                axisLine={false}
              />
              {selectedVendors.map((v, i) => (
                <Radar
                  key={v.id}
                  name={v.name}
                  dataKey={v.name}
                  stroke={COLORS[i]}
                  fill={COLORS[i]}
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
