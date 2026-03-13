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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorDetailData, ComparisonVendor } from "./vendor-detail";

interface BenchmarksTabProps {
  vendor: VendorDetailData;
  comparisonVendors: ComparisonVendor[];
}

const COLORS = ["#2E75B6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function BenchmarksTab({ vendor, comparisonVendors }: BenchmarksTabProps) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const addComparison = (id: string) => {
    if (compareIds.length < 4 && !compareIds.includes(id)) {
      setCompareIds((prev) => [...prev, id]);
    }
    setDropdownOpen(false);
  };

  const removeComparison = (id: string) => {
    setCompareIds((prev) => prev.filter((x) => x !== id));
  };

  // Build radar data
  const radarData = useMemo(() => {
    const selected = compareIds.map((id) => comparisonVendors.find((v) => v.id === id)).filter(Boolean) as ComparisonVendor[];

    return vendor.dimensions.map((dim) => {
      const point: Record<string, string | number> = {
        dimension: dim.name.length > 14 ? dim.name.slice(0, 12) + "…" : dim.name,
        fullName: dim.name,
        [vendor.name]: dim.score,
      };
      selected.forEach((sv) => {
        const match = sv.dimensions.find((d) => d.key === dim.key);
        point[sv.name] = match?.score ?? 0;
      });
      return point;
    });
  }, [vendor, compareIds, comparisonVendors]);

  // Simulated historical trend data
  const trendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const baseScore = vendor.overallScore;
    return months.map((month, i) => ({
      month,
      score: Math.max(0, Math.min(100, Math.round(baseScore - 12 + i * 1.1 + Math.sin(i * 0.8) * 3))),
    }));
  }, [vendor.overallScore]);

  const selectedVendors = compareIds.map((id) => comparisonVendors.find((v) => v.id === id)).filter(Boolean) as ComparisonVendor[];
  const availableForComparison = comparisonVendors.filter((v) => !compareIds.includes(v.id));

  return (
    <div className="space-y-8">
      {/* Radar Chart Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy">Dimension Radar</h3>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={compareIds.length >= 4}
              className={cn(
                "nav-transition inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium",
                compareIds.length >= 4
                  ? "cursor-not-allowed border-navy-100 text-navy-300"
                  : "border-blue-200 text-blue hover:bg-blue-50"
              )}
            >
              <Plus size={12} />
              Add Comparison
            </button>
            {dropdownOpen && availableForComparison.length > 0 && (
              <div className="absolute right-0 top-full z-20 mt-1 max-h-60 w-56 overflow-y-auto rounded-lg border border-navy-100 bg-white py-1 shadow-lg">
                {availableForComparison.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => addComparison(v.id)}
                    className="nav-transition w-full px-3 py-2 text-left text-xs text-navy-500 hover:bg-navy-50"
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comparison pills */}
        {selectedVendors.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedVendors.map((sv, i) => (
              <span
                key={sv.id}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
                style={{ borderColor: COLORS[i + 1], color: COLORS[i + 1] }}
              >
                {sv.name}
                <button onClick={() => removeComparison(sv.id)} className="hover:opacity-60">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {vendor.dimensions.length > 0 ? (
          <div className="flex justify-center">
            <div className="h-[400px] w-full max-w-[600px]">
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
                  <Radar
                    name={vendor.name}
                    dataKey={vendor.name}
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  {selectedVendors.map((sv, i) => (
                    <Radar
                      key={sv.id}
                      name={sv.name}
                      dataKey={sv.name}
                      stroke={COLORS[i + 1]}
                      fill={COLORS[i + 1]}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="text-sm text-navy-300">No dimension data available for radar chart.</p>
        )}
      </div>

      {/* Historical Score Trend */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-navy">Score Trend (12 Months)</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8fa4c4" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#8fa4c4" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e8edf5",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Overall Score"
                stroke="#2E75B6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#2E75B6" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Benchmark Results Table */}
      {vendor.benchmarkResults.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-navy">Benchmark Results</h3>
          <div className="overflow-x-auto rounded-lg border border-navy-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50/60">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Benchmark
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Category
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Value
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Unit
                  </th>
                </tr>
              </thead>
              <tbody>
                {vendor.benchmarkResults.map((br) => (
                  <tr key={br.id} className="border-b border-navy-50">
                    <td className="px-4 py-2.5 font-medium text-navy">{br.benchmark.name}</td>
                    <td className="px-4 py-2.5 text-navy-400">{br.benchmark.category}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-navy">{br.value.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-center text-navy-300">{br.benchmark.unit ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
