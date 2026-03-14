"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EvaluationWizard } from "./evaluation-wizard";
import { EvaluationDetail } from "./evaluation-detail";

// ─── Types ──────────────────────────────────────────────────────

export interface EvalData {
  id: string;
  title: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  vendorTier: string;
  categoryName: string | null;
  categoryColor: string | null;
  status: string;
  score: number | null;
  summary: string | null;
  notes: string;
  recommendation: string;
  dimensions: { key: string; name: string; weight: number; score: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  criteria: { id: string; key: string; name: string; weight: number }[];
}

export interface VendorOption {
  id: string;
  name: string;
  slug: string;
  tier: string;
  categoryIds: string[];
  benchmarkScores: { criterionKey: string; criterionName: string; score: number }[];
}

type View = "list" | "wizard" | "detail";

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; cls: string; label: string; bg: string }> = {
  completed: { icon: CheckCircle2, cls: "text-emerald-600", label: "Completed", bg: "bg-emerald-50" },
  in_progress: { icon: Clock, cls: "text-blue-600", label: "In Progress", bg: "bg-blue-50" },
  draft: { icon: AlertCircle, cls: "text-amber-600", label: "Draft", bg: "bg-amber-50" },
  archived: { icon: Archive, cls: "text-gray-400", label: "Archived", bg: "bg-gray-50" },
};

// ─── Main Component ─────────────────────────────────────────────

interface EvaluationsHubProps {
  evaluations: EvalData[];
  categories: CategoryOption[];
  vendors: VendorOption[];
}

export function EvaluationsHub({ evaluations, categories, vendors }: EvaluationsHubProps) {
  const [view, setView] = useState<View>("list");
  const [selectedEvalId, setSelectedEvalId] = useState<string | null>(null);
  const [evals, setEvals] = useState(evaluations);

  const selectedEval = evals.find((e) => e.id === selectedEvalId) ?? null;

  const statusCounts = useMemo(() => {
    const counts = { draft: 0, in_progress: 0, completed: 0, archived: 0 };
    evals.forEach((e) => {
      if (e.status in counts) counts[e.status as keyof typeof counts]++;
    });
    return counts;
  }, [evals]);

  const handleNewEvaluation = () => setView("wizard");

  const handleViewDetail = (id: string) => {
    setSelectedEvalId(id);
    setView("detail");
  };

  const handleBack = () => {
    setView("list");
    setSelectedEvalId(null);
  };

  const handleEvalCreated = (newEval: EvalData) => {
    setEvals((prev) => [newEval, ...prev]);
    setSelectedEvalId(newEval.id);
    setView("detail");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {view !== "list" && (
            <button
              onClick={handleBack}
              className="nav-transition rounded-lg p-2 text-navy-400 hover:bg-navy-50 hover:text-navy"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-navy">
              {view === "wizard" ? "New Evaluation" : view === "detail" ? "Evaluation Detail" : "Evaluations"}
            </h1>
            <p className="mt-1 text-navy-400">
              {view === "wizard"
                ? "Score a vendor across category dimensions"
                : view === "detail"
                  ? selectedEval?.title ?? ""
                  : `${evals.length} evaluations across ${new Set(evals.map((e) => e.vendorId)).size} vendors`}
            </p>
          </div>
        </div>
        {view === "list" && (
          <button
            onClick={handleNewEvaluation}
            className="nav-transition inline-flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            New Evaluation
          </button>
        )}
      </div>

      {/* Status cards (list view only) */}
      {view === "list" && (
        <div className="grid gap-3 sm:grid-cols-4">
          {(["in_progress", "completed", "draft", "archived"] as const).map((status) => {
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            return (
              <div key={status} className="rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <Icon size={18} className={cfg.cls} />
                  <span className="text-2xl font-bold text-navy">{statusCounts[status]}</span>
                </div>
                <p className="mt-1 text-xs text-navy-400">{cfg.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Views */}
      {view === "list" && (
        <EvaluationHistoryList evaluations={evals} onViewDetail={handleViewDetail} />
      )}
      {view === "wizard" && (
        <EvaluationWizard
          categories={categories}
          vendors={vendors}
          onComplete={handleEvalCreated}
          onCancel={handleBack}
        />
      )}
      {view === "detail" && selectedEval && (
        <EvaluationDetail
          evaluation={selectedEval}
          vendor={vendors.find((v) => v.id === selectedEval.vendorId) ?? null}
        />
      )}
    </div>
  );
}

// ─── History List ───────────────────────────────────────────────

type SortField = "updatedAt" | "vendorName" | "score" | "status";
type SortDir = "asc" | "desc";

function EvaluationHistoryList({
  evaluations,
  onViewDetail,
}: {
  evaluations: EvalData[];
  onViewDetail: (id: string) => void;
}) {
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "vendorName" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    const arr = [...evaluations];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "updatedAt":
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case "vendorName":
          cmp = a.vendorName.localeCompare(b.vendorName);
          break;
        case "score":
          cmp = (a.score ?? 0) - (b.score ?? 0);
          break;
        case "status": {
          const o = { in_progress: 0, draft: 1, completed: 2, archived: 3 };
          cmp = (o[a.status as keyof typeof o] ?? 4) - (o[b.status as keyof typeof o] ?? 4);
          break;
        }
      }
      return cmp * dir;
    });
    return arr;
  }, [evaluations, sortField, sortDir]);

  if (evaluations.length === 0) {
    return (
      <div className="rounded-xl border border-navy-100 bg-white p-12 text-center shadow-sm">
        <ClipboardCheck className="mx-auto h-12 w-12 text-navy-200" />
        <h3 className="mt-4 font-semibold text-navy">No Evaluations Yet</h3>
        <p className="mt-2 text-sm text-navy-400">
          Create your first vendor evaluation to get started.
        </p>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortDir === "asc" ? <ArrowUp size={11} className="text-blue" /> : <ArrowDown size={11} className="text-blue" />
    ) : (
      <ArrowUpDown size={11} className="opacity-30" />
    );

  return (
    <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50/60">
              <ThSort field="updatedAt" label="Date" current={sortField} onClick={handleSort}>
                <SortIcon field="updatedAt" />
              </ThSort>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                Title
              </th>
              <ThSort field="vendorName" label="Vendor" current={sortField} onClick={handleSort} align="left">
                <SortIcon field="vendorName" />
              </ThSort>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                Category
              </th>
              <ThSort field="score" label="Score" current={sortField} onClick={handleSort}>
                <SortIcon field="score" />
              </ThSort>
              <ThSort field="status" label="Status" current={sortField} onClick={handleSort}>
                <SortIcon field="status" />
              </ThSort>
              <th className="w-16 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((ev) => {
              const statusCfg = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.draft;
              const StatusIcon = statusCfg.icon;
              return (
                <tr
                  key={ev.id}
                  className="nav-transition cursor-pointer border-b border-navy-50 hover:bg-navy-50/40"
                  onClick={() => onViewDetail(ev.id)}
                >
                  <td className="px-4 py-3 text-xs text-navy-400">
                    {new Date(ev.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-navy">{ev.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-navy-500">{ev.vendorName}</span>
                  </td>
                  <td className="px-4 py-3">
                    {ev.categoryName ? (
                      <span
                        className="inline-block rounded-md px-2 py-0.5 text-[10px] font-medium text-white"
                        style={{ backgroundColor: ev.categoryColor ?? "#5476a9" }}
                      >
                        {ev.categoryName}
                      </span>
                    ) : (
                      <span className="text-xs text-navy-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {ev.score !== null ? (
                      <ScoreBadge score={ev.score} />
                    ) : (
                      <span className="text-xs text-navy-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", statusCfg.bg, statusCfg.cls)}>
                      <StatusIcon size={10} />
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight size={14} className="text-navy-300" />
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

// ─── Helpers ────────────────────────────────────────────────────

function ThSort({
  field,
  label,
  current,
  onClick,
  align = "center",
  children,
}: {
  field: SortField;
  label: string;
  current: SortField;
  onClick: (f: SortField) => void;
  align?: "left" | "center";
  children: React.ReactNode;
}) {
  return (
    <th
      className={cn(
        "cursor-pointer select-none whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-navy-400 hover:text-navy",
        align === "center" && "text-center"
      )}
      onClick={() => onClick(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {children}
      </span>
    </th>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-emerald-50 text-emerald-700"
      : score >= 50 ? "bg-blue-50 text-blue-700"
        : score >= 25 ? "bg-amber-50 text-amber-700"
          : "bg-red-50 text-red-600";
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", color)}>
      {score}
    </span>
  );
}
