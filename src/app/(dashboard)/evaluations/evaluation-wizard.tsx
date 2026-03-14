"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Layers,
  Building2,
  SlidersHorizontal,
  FileText,
  Eye,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryOption, VendorOption, EvalData } from "./evaluations-hub";

// ─── Types ──────────────────────────────────────────────────────

interface WizardProps {
  categories: CategoryOption[];
  vendors: VendorOption[];
  onComplete: (evaluation: EvalData) => void;
  onCancel: () => void;
}

const STEPS = [
  { key: "category", label: "Category", icon: Layers },
  { key: "vendor", label: "Vendor", icon: Building2 },
  { key: "scoring", label: "Score Dimensions", icon: SlidersHorizontal },
  { key: "notes", label: "Notes & Recommendation", icon: FileText },
  { key: "review", label: "Review & Submit", icon: Eye },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

// ─── Wizard Component ───────────────────────────────────────────

export function EvaluationWizard({ categories, vendors, onComplete, onCancel }: WizardProps) {
  const [step, setStep] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [dimensionScores, setDimensionScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

  // Vendors filtered by selected category
  const filteredVendors = useMemo(() => {
    if (!selectedCategoryId) return vendors;
    return vendors.filter((v) => v.categoryIds.includes(selectedCategoryId));
  }, [vendors, selectedCategoryId]);

  // Initialize dimension scores when category changes
  const initScores = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      const scores: Record<string, number> = {};
      cat.criteria.forEach((c) => { scores[c.key] = 50; });
      setDimensionScores(scores);
    }
  };

  // Can proceed to next step?
  const canProceed = (() => {
    switch (step) {
      case 0: return !!selectedCategoryId;
      case 1: return !!selectedVendorId;
      case 2: return Object.keys(dimensionScores).length > 0;
      case 3: return true;
      case 4: return !!title;
      default: return false;
    }
  })();

  // Overall score
  const overallScore = useMemo(() => {
    if (!selectedCategory) return 0;
    const totalWeight = selectedCategory.criteria.reduce((sum, c) => sum + c.weight, 0);
    const weightedSum = selectedCategory.criteria.reduce(
      (sum, c) => sum + (dimensionScores[c.key] ?? 50) * c.weight,
      0
    );
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }, [selectedCategory, dimensionScores]);

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !selectedVendor || submitting) return;
    setSubmitting(true);

    const evalTitle = title || `${selectedVendor.name} — ${selectedCategory.name} Evaluation`;
    const dimensions = selectedCategory.criteria.map((c) => ({
      key: c.key,
      name: c.name,
      score: dimensionScores[c.key] ?? 50,
      weight: c.weight,
    }));

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: evalTitle,
          vendorId: selectedVendorId,
          categoryId: selectedCategoryId,
          status: "completed",
          dimensions,
          notes,
          recommendation,
        }),
      });

      if (!res.ok) throw new Error("Failed to create evaluation");
      const data = await res.json();

      // Build EvalData from response
      const newEval: EvalData = {
        id: data.evaluation.id,
        title: evalTitle,
        vendorId: selectedVendorId,
        vendorName: selectedVendor.name,
        vendorSlug: selectedVendor.slug,
        vendorTier: selectedVendor.tier,
        categoryName: selectedCategory.name,
        categoryColor: null,
        status: "completed",
        score: overallScore,
        summary: recommendation || notes || null,
        notes,
        recommendation,
        dimensions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onComplete(newEval);
    } catch (err) {
      console.error("Submit failed:", err);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full nav-transition",
                      isDone ? "bg-emerald-500 text-white" :
                        isActive ? "bg-blue text-white" :
                          "bg-navy-50 text-navy-300"
                    )}
                  >
                    {isDone ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-blue" : isDone ? "text-emerald-600" : "text-navy-300"
                  )}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("mx-2 h-px flex-1", i < step ? "bg-emerald-300" : "bg-navy-100")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        {step === 0 && (
          <StepCategory
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={(id) => { setSelectedCategoryId(id); initScores(id); setSelectedVendorId(""); }}
          />
        )}
        {step === 1 && (
          <StepVendor
            vendors={filteredVendors}
            selectedId={selectedVendorId}
            onSelect={setSelectedVendorId}
            categoryName={selectedCategory?.name ?? ""}
          />
        )}
        {step === 2 && selectedCategory && (
          <StepScoring
            criteria={selectedCategory.criteria}
            scores={dimensionScores}
            onScoreChange={(key, val) => setDimensionScores((prev) => ({ ...prev, [key]: val }))}
            vendorBenchmarks={selectedVendor?.benchmarkScores ?? []}
          />
        )}
        {step === 3 && (
          <StepNotes
            notes={notes}
            recommendation={recommendation}
            title={title}
            vendorName={selectedVendor?.name ?? ""}
            categoryName={selectedCategory?.name ?? ""}
            onNotesChange={setNotes}
            onRecommendationChange={setRecommendation}
            onTitleChange={setTitle}
          />
        )}
        {step === 4 && selectedCategory && selectedVendor && (
          <StepReview
            category={selectedCategory}
            vendor={selectedVendor}
            scores={dimensionScores}
            overallScore={overallScore}
            notes={notes}
            recommendation={recommendation}
            title={title || `${selectedVendor.name} — ${selectedCategory.name} Evaluation`}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={step === 0 ? onCancel : handleBack}
          className="nav-transition inline-flex items-center gap-1 rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-500 hover:border-blue hover:text-blue"
        >
          <ChevronLeft size={14} />
          {step === 0 ? "Cancel" : "Back"}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="nav-transition inline-flex items-center gap-1 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            Next
            <ChevronRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !canProceed}
            className="nav-transition inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {submitting ? "Submitting…" : "Submit Evaluation"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Select Category ────────────────────────────────────

function StepCategory({
  categories,
  selectedId,
  onSelect,
}: {
  categories: CategoryOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-1 text-lg font-semibold text-navy">Select Category</h3>
      <p className="mb-4 text-sm text-navy-400">Choose which category to evaluate the vendor in.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "nav-transition rounded-xl border p-4 text-left",
              selectedId === cat.id
                ? "border-blue bg-blue-50/40 shadow-sm"
                : "border-navy-100 hover:border-blue-200"
            )}
          >
            <h4 className={cn("text-sm font-semibold", selectedId === cat.id ? "text-blue" : "text-navy")}>
              {cat.name}
            </h4>
            <p className="mt-1 text-[11px] text-navy-400">
              {cat.criteria.length} evaluation dimensions
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {cat.criteria.slice(0, 3).map((c) => (
                <span key={c.key} className="rounded bg-navy-50 px-1.5 py-0.5 text-[9px] text-navy-400">
                  {c.name}
                </span>
              ))}
              {cat.criteria.length > 3 && (
                <span className="text-[9px] text-navy-300">+{cat.criteria.length - 3}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Select Vendor ──────────────────────────────────────

function StepVendor({
  vendors,
  selectedId,
  onSelect,
  categoryName,
}: {
  vendors: VendorOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  categoryName: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h3 className="mb-1 text-lg font-semibold text-navy">Select Vendor</h3>
      <p className="mb-4 text-sm text-navy-400">
        Choose a vendor to evaluate in {categoryName}.
      </p>
      <input
        type="text"
        placeholder="Search vendors…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue/30"
      />
      <div className="grid max-h-[400px] gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => {
          const tierCls = v.tier === "leader" ? "text-emerald-600"
            : v.tier === "challenger" ? "text-blue-600"
              : v.tier === "emerging" ? "text-amber-600" : "text-gray-500";
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className={cn(
                "nav-transition rounded-lg border p-3 text-left",
                selectedId === v.id
                  ? "border-blue bg-blue-50/40"
                  : "border-navy-50 hover:border-blue-200"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-medium", selectedId === v.id ? "text-blue" : "text-navy")}>
                  {v.name}
                </span>
                <span className={cn("text-[10px] font-medium capitalize", tierCls)}>
                  {v.tier}
                </span>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-navy-300">No vendors found.</p>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Score Dimensions ───────────────────────────────────

function StepScoring({
  criteria,
  scores,
  onScoreChange,
  vendorBenchmarks,
}: {
  criteria: CategoryOption["criteria"];
  scores: Record<string, number>;
  onScoreChange: (key: string, value: number) => void;
  vendorBenchmarks: { criterionKey: string; criterionName: string; score: number }[];
}) {
  const benchmarkMap = new Map(vendorBenchmarks.map((b) => [b.criterionKey, b.score]));

  return (
    <div>
      <h3 className="mb-1 text-lg font-semibold text-navy">Score Dimensions</h3>
      <p className="mb-5 text-sm text-navy-400">
        Rate each dimension from 0 (poor) to 100 (excellent). Existing benchmark scores shown for reference.
      </p>
      <div className="space-y-5">
        {criteria.map((c) => {
          const score = scores[c.key] ?? 50;
          const benchmark = benchmarkMap.get(c.key);
          const color = score >= 75 ? "#10b981" : score >= 50 ? "#2E75B6" : score >= 25 ? "#f59e0b" : "#f87171";

          return (
            <div key={c.key} className="rounded-lg border border-navy-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-navy">{c.name}</span>
                  <span className="ml-2 text-[10px] text-navy-300">weight: {c.weight}×</span>
                </div>
                <div className="flex items-center gap-3">
                  {benchmark !== undefined && (
                    <span className="rounded bg-navy-50 px-2 py-0.5 text-[10px] text-navy-400">
                      Benchmark: {benchmark}
                    </span>
                  )}
                  <span className="w-10 text-right text-lg font-bold" style={{ color }}>
                    {score}
                  </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(e) => onScoreChange(c.key, Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-navy-100 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                  style={{
                    // @ts-expect-error -- CSS custom property
                    "--tw-slider-color": color,
                    accentColor: color,
                  }}
                />
                {benchmark !== undefined && (
                  <div
                    className="absolute top-0 h-2 w-0.5 rounded bg-navy-400"
                    style={{ left: `${benchmark}%` }}
                    title={`Benchmark: ${benchmark}`}
                  />
                )}
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-navy-300">
                <span>0 — Poor</span>
                <span>50 — Average</span>
                <span>100 — Excellent</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 4: Notes & Recommendation ─────────────────────────────

function StepNotes({
  notes,
  recommendation,
  title,
  vendorName,
  categoryName,
  onNotesChange,
  onRecommendationChange,
  onTitleChange,
}: {
  notes: string;
  recommendation: string;
  title: string;
  vendorName: string;
  categoryName: string;
  onNotesChange: (v: string) => void;
  onRecommendationChange: (v: string) => void;
  onTitleChange: (v: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-1 text-lg font-semibold text-navy">Notes & Recommendation</h3>
      <p className="mb-5 text-sm text-navy-400">Add context and your final recommendation.</p>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-navy-500">Evaluation Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={`${vendorName} — ${categoryName} Evaluation`}
            className="w-full rounded-lg border border-navy-200 px-4 py-2.5 text-sm focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-navy-500">
            Evaluation Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Key findings, strengths, weaknesses, observations…"
            rows={4}
            className="w-full rounded-lg border border-navy-200 px-4 py-2.5 text-sm focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-navy-500">
            Recommendation
          </label>
          <textarea
            value={recommendation}
            onChange={(e) => onRecommendationChange(e.target.value)}
            placeholder="Your recommendation: approve, reject, further evaluation needed…"
            rows={3}
            className="w-full rounded-lg border border-navy-200 px-4 py-2.5 text-sm focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue/30"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Review ─────────────────────────────────────────────

function StepReview({
  category,
  vendor,
  scores,
  overallScore,
  notes,
  recommendation,
  title,
}: {
  category: CategoryOption;
  vendor: VendorOption;
  scores: Record<string, number>;
  overallScore: number;
  notes: string;
  recommendation: string;
  title: string;
}) {
  const scoreColor = overallScore >= 75 ? "text-emerald-600"
    : overallScore >= 50 ? "text-blue-600"
      : overallScore >= 25 ? "text-amber-600" : "text-red-500";

  return (
    <div>
      <h3 className="mb-1 text-lg font-semibold text-navy">Review & Submit</h3>
      <p className="mb-5 text-sm text-navy-400">Review your evaluation before submitting.</p>

      <div className="space-y-4">
        {/* Summary header */}
        <div className="rounded-lg border border-navy-100 bg-navy-50/30 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-navy">{title}</h4>
              <p className="mt-0.5 text-xs text-navy-400">
                {vendor.name} · {category.name} · {vendor.tier}
              </p>
            </div>
            <div className="text-center">
              <p className={cn("text-3xl font-bold", scoreColor)}>{overallScore}</p>
              <p className="text-[10px] text-navy-300">Overall Score</p>
            </div>
          </div>
        </div>

        {/* Dimension scores */}
        <div className="rounded-lg border border-navy-50 p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
            Dimension Scores
          </h4>
          <div className="space-y-2">
            {category.criteria.map((c) => {
              const score = scores[c.key] ?? 50;
              const barColor = score >= 75 ? "from-emerald-400 to-emerald-500"
                : score >= 50 ? "from-blue to-blue-600"
                  : score >= 25 ? "from-amber-400 to-amber-500"
                    : "from-red-400 to-red-500";
              return (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 text-xs text-navy-500">{c.name}</span>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-navy-50">
                      <div
                        className={cn("h-full rounded-full bg-gradient-to-r", barColor)}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right text-xs font-bold text-navy">{score}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes & recommendation */}
        {(notes || recommendation) && (
          <div className="rounded-lg border border-navy-50 p-4">
            {notes && (
              <div className="mb-3">
                <h4 className="mb-1 text-xs font-semibold text-navy-400">Notes</h4>
                <p className="text-sm text-navy-500">{notes}</p>
              </div>
            )}
            {recommendation && (
              <div>
                <h4 className="mb-1 text-xs font-semibold text-navy-400">Recommendation</h4>
                <p className="text-sm text-navy-500">{recommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
