"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  FileText,
  MessageSquare,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreGauge } from "../vendors/score-gauge";
import type { EvalData, VendorOption } from "./evaluations-hub";

interface EvaluationDetailProps {
  evaluation: EvalData;
  vendor: VendorOption | null;
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; cls: string; label: string; bg: string }> = {
  completed: { icon: CheckCircle2, cls: "text-emerald-600", label: "Completed", bg: "bg-emerald-50" },
  in_progress: { icon: Clock, cls: "text-blue-600", label: "In Progress", bg: "bg-blue-50" },
  draft: { icon: AlertCircle, cls: "text-amber-600", label: "Draft", bg: "bg-amber-50" },
  archived: { icon: Archive, cls: "text-gray-400", label: "Archived", bg: "bg-gray-50" },
};

export function EvaluationDetail({ evaluation, vendor }: EvaluationDetailProps) {
  const statusCfg = STATUS_CONFIG[evaluation.status] ?? STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.icon;

  // Build radar data with benchmark comparison
  const radarData = useMemo(() => {
    const benchmarkMap = new Map(
      (vendor?.benchmarkScores ?? []).map((b) => [b.criterionKey, b.score])
    );

    return evaluation.dimensions.map((d) => ({
      dimension: d.name.length > 16 ? d.name.slice(0, 14) + "…" : d.name,
      fullName: d.name,
      "Your Score": d.score,
      "Benchmark": benchmarkMap.get(d.key) ?? 0,
    }));
  }, [evaluation.dimensions, vendor]);

  const hasBenchmarks = vendor && vendor.benchmarkScores.length > 0;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-navy">{evaluation.title}</h2>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", statusCfg.bg, statusCfg.cls)}>
                <StatusIcon size={12} />
                {statusCfg.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-navy-400">
              <Link href={`/vendors/${evaluation.vendorSlug}`} className="font-medium text-blue hover:underline">
                {evaluation.vendorName}
              </Link>
              {evaluation.categoryName && (
                <span className="rounded bg-navy-50 px-2 py-0.5 text-navy-400">
                  {evaluation.categoryName}
                </span>
              )}
              <span>
                {new Date(evaluation.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {evaluation.score !== null && (
              <ScoreGauge score={evaluation.score} size={72} strokeWidth={4.5} />
            )}
            <Link
              href={`/vendors/${evaluation.vendorSlug}`}
              className="nav-transition inline-flex items-center gap-1 rounded-lg border border-navy-200 px-3 py-2 text-xs font-medium text-navy-500 hover:border-blue hover:text-blue"
            >
              <ExternalLink size={12} />
              Vendor Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column: radar + dimension breakdown */}
        <div className="space-y-6 lg:col-span-3">
          {/* Radar chart */}
          {evaluation.dimensions.length > 0 && (
            <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue" />
                <h3 className="text-sm font-semibold text-navy">Score Radar</h3>
                {hasBenchmarks && (
                  <span className="ml-auto text-[10px] text-navy-300">
                    vs. Benchmark scores from platform data
                  </span>
                )}
              </div>
              <div className="flex justify-center">
                <div className="h-[350px] w-full max-w-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="#e8edf5" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: "#5476a9" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#8fa4c4" }} axisLine={false} />
                      <Radar
                        name="Your Score"
                        dataKey="Your Score"
                        stroke="#2E75B6"
                        fill="#2E75B6"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      {hasBenchmarks && (
                        <Radar
                          name="Benchmark"
                          dataKey="Benchmark"
                          stroke="#f59e0b"
                          fill="#f59e0b"
                          fillOpacity={0.1}
                          strokeWidth={2}
                          strokeDasharray="4 4"
                        />
                      )}
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Dimension breakdown */}
          <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-navy">Dimension Breakdown</h3>
            <div className="space-y-3">
              {evaluation.dimensions
                .sort((a, b) => b.score - a.score)
                .map((dim) => {
                  const benchmark = vendor?.benchmarkScores.find((b) => b.criterionKey === dim.key);
                  const diff = benchmark ? dim.score - benchmark.score : null;
                  const barColor = dim.score >= 75 ? "from-emerald-400 to-emerald-500"
                    : dim.score >= 50 ? "from-blue to-blue-600"
                      : dim.score >= 25 ? "from-amber-400 to-amber-500"
                        : "from-red-400 to-red-500";

                  return (
                    <div key={dim.key} className="rounded-lg border border-navy-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-navy">{dim.name}</span>
                          <span className="text-[9px] text-navy-300">×{dim.weight}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {diff !== null && (
                            <span className={cn(
                              "text-[10px] font-medium",
                              diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-navy-300"
                            )}>
                              {diff > 0 ? "+" : ""}{diff} vs benchmark
                            </span>
                          )}
                          <span className="text-lg font-bold text-navy">{dim.score}</span>
                        </div>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-navy-50">
                        <div
                          className={cn("h-full rounded-full bg-gradient-to-r nav-transition", barColor)}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                      {benchmark && (
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-transparent">
                          <div
                            className="h-full rounded-full bg-amber-300/50"
                            style={{ width: `${benchmark.score}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right column: notes, recommendation, metadata */}
        <div className="space-y-6 lg:col-span-2">
          {/* Score summary */}
          <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
              Score Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-navy-50/60 p-3 text-center">
                <p className="text-2xl font-bold text-navy">{evaluation.score ?? "—"}</p>
                <p className="text-[10px] text-navy-300">Overall Score</p>
              </div>
              <div className="rounded-lg bg-navy-50/60 p-3 text-center">
                <p className="text-2xl font-bold text-navy">{evaluation.dimensions.length}</p>
                <p className="text-[10px] text-navy-300">Dimensions</p>
              </div>
              <div className="rounded-lg bg-navy-50/60 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {evaluation.dimensions.filter((d) => d.score >= 75).length}
                </p>
                <p className="text-[10px] text-navy-300">Strong (≥75)</p>
              </div>
              <div className="rounded-lg bg-navy-50/60 p-3 text-center">
                <p className="text-2xl font-bold text-red-500">
                  {evaluation.dimensions.filter((d) => d.score < 50).length}
                </p>
                <p className="text-[10px] text-navy-300">Weak (&lt;50)</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {evaluation.notes && (
            <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-1.5">
                <FileText size={14} className="text-navy-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400">Notes</h3>
              </div>
              <p className="text-sm leading-relaxed text-navy-500">{evaluation.notes}</p>
            </div>
          )}

          {/* Recommendation */}
          {evaluation.recommendation && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-blue" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue">Recommendation</h3>
              </div>
              <p className="text-sm leading-relaxed text-navy">{evaluation.recommendation}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
              Details
            </h3>
            <dl className="space-y-2 text-xs">
              <MetaRow label="Vendor" value={evaluation.vendorName} />
              <MetaRow label="Tier" value={evaluation.vendorTier} capitalize />
              {evaluation.categoryName && <MetaRow label="Category" value={evaluation.categoryName} />}
              <MetaRow label="Status" value={(STATUS_CONFIG[evaluation.status] ?? STATUS_CONFIG.draft).label} />
              <MetaRow label="Created" value={new Date(evaluation.createdAt).toLocaleDateString()} />
              <MetaRow label="Updated" value={new Date(evaluation.updatedAt).toLocaleDateString()} />
              <MetaRow label="Evaluation ID" value={evaluation.id} mono />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value, capitalize, mono }: { label: string; value: string; capitalize?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-navy-400">{label}</dt>
      <dd className={cn("font-medium text-navy", capitalize && "capitalize", mono && "font-mono text-[10px]")}>{value}</dd>
    </div>
  );
}
