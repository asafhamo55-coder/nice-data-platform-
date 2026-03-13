"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calculator,
  DollarSign,
  Users,
  Database,
  Zap,
  HardDrive,
  Headphones,
  ArrowUpRight,
  AlertTriangle,
  Info,
  Plus,
  X,
  ChevronDown,
  Download,
  Server,
  GraduationCap,
  Truck,
  ShieldAlert,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WORKLOAD_PRESETS,
  calculateVendorCost,
} from "@/lib/scoring/pricing-engine";
import type {
  WorkloadProfile,
  VendorPricingProfile,
  VendorCostEstimate,
  HiddenCost,
} from "@/lib/scoring/pricing-engine";

// ─── Types ──────────────────────────────────────────────────────

interface VendorOption {
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  tier: string;
  pricingModel: string;
  category: string;
  categoryId: string;
  categoryColor: string | null;
}

interface PricingHubProps {
  vendors: VendorOption[];
  categories: { id: string; name: string; slug: string }[];
}

const PRICING_MODEL_LABELS: Record<string, string> = {
  "usage-based": "Usage-Based",
  "seat-based": "Seat-Based",
  "credit-based": "Credit-Based",
  "free": "Free / OSS",
  "open-source": "Open Source",
  "freemium": "Freemium",
  "enterprise": "Enterprise",
  "pay-as-you-go": "Pay-as-you-go",
};

const HIDDEN_COST_ICONS: Record<string, typeof AlertTriangle> = {
  egress: ArrowUpRight,
  training: GraduationCap,
  migration: Truck,
  support: Headphones,
  overage: TrendingUp,
};

const HIDDEN_COST_COLORS: Record<string, string> = {
  low: "border-amber-200 bg-amber-50 text-amber-800",
  medium: "border-orange-200 bg-orange-50 text-orange-800",
  high: "border-red-200 bg-red-50 text-red-800",
};

// ─── Main Component ─────────────────────────────────────────────

export function PricingHub({ vendors, categories }: PricingHubProps) {
  // Workload state
  const [profileKey, setProfileKey] = useState<string>("medium");
  const [customProfile, setCustomProfile] = useState<WorkloadProfile>({
    key: "custom",
    label: "Custom",
    description: "Your custom workload",
    users: 100,
    dataVolumeTB: 10,
    queriesPerDay: 10000,
    storageGB: 5000,
    egressGB: 1000,
    engineeringHours: 100,
  });

  // Vendor selection
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"monthly" | "annual" | "threeYear">("monthly");

  const activeProfile = profileKey === "custom"
    ? customProfile
    : WORKLOAD_PRESETS.find((p) => p.key === profileKey) ?? WORKLOAD_PRESETS[1];

  // Filter vendors
  const filteredVendors = useMemo(() => {
    if (categoryFilter === "all") return vendors;
    return vendors.filter((v) => v.categoryId === categoryFilter);
  }, [vendors, categoryFilter]);

  const availableVendors = filteredVendors.filter((v) => !selectedVendorIds.includes(v.vendorId));
  const selectedVendors = selectedVendorIds
    .map((id) => vendors.find((v) => v.vendorId === id))
    .filter(Boolean) as VendorOption[];

  // Calculate costs
  const costEstimates = useMemo(() => {
    return selectedVendors.map((v) =>
      calculateVendorCost(
        {
          vendorId: v.vendorId,
          vendorName: v.vendorName,
          vendorSlug: v.vendorSlug,
          tier: v.tier,
          pricingModel: v.pricingModel,
          category: v.category,
        },
        activeProfile
      )
    );
  }, [selectedVendors, activeProfile]);

  // Collect all hidden costs
  const allHiddenCosts = useMemo(() => {
    const seen = new Set<string>();
    const costs: (HiddenCost & { vendorName: string })[] = [];
    costEstimates.forEach((est) => {
      est.hiddenCosts.forEach((hc) => {
        const key = `${hc.type}-${hc.title}`;
        if (!seen.has(key)) {
          seen.add(key);
          costs.push({ ...hc, vendorName: est.vendorName });
        }
      });
    });
    return costs;
  }, [costEstimates]);

  const addVendor = (id: string) => {
    if (selectedVendorIds.length < 4) {
      setSelectedVendorIds((prev) => [...prev, id]);
    }
    setVendorDropdownOpen(false);
  };

  const removeVendor = (id: string) => {
    setSelectedVendorIds((prev) => prev.filter((x) => x !== id));
  };

  const updateCustom = (field: keyof WorkloadProfile, value: number) => {
    setCustomProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleExportCsv = () => {
    if (costEstimates.length === 0) return;
    const header = ["Vendor", "Pricing Model", "Monthly Total", "Annual Total", "3-Year TCO", "Compute", "Storage", "Seats", "Support", "Egress", "Other"];
    const rows = costEstimates.map((e) => [
      e.vendorName, e.pricingModel,
      String(e.monthly.total), String(e.annual.total), String(e.threeYear.total),
      String(e.monthly.compute), String(e.monthly.storage), String(e.monthly.seats),
      String(e.monthly.support), String(e.monthly.egress), String(e.monthly.other),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pricing-comparison.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">Pricing Calculator</h1>
          <p className="mt-1 text-navy-400">
            Compare vendor costs side-by-side with customizable workload profiles
          </p>
        </div>
        {costEstimates.length > 0 && (
          <button
            onClick={handleExportCsv}
            className="nav-transition inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-2 text-sm font-medium text-navy-500 hover:border-blue hover:text-blue"
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      {/* ─── 1. Workload Profile Selector ──────────────────────── */}
      <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Server size={18} className="text-blue" />
          <h2 className="text-lg font-semibold text-navy">Workload Profile</h2>
        </div>

        {/* Preset cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WORKLOAD_PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => setProfileKey(preset.key)}
              className={cn(
                "nav-transition rounded-xl border p-4 text-left",
                profileKey === preset.key
                  ? "border-blue bg-blue-50/50 shadow-sm"
                  : "border-navy-100 hover:border-blue-200"
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className={cn("text-sm font-semibold", profileKey === preset.key ? "text-blue" : "text-navy")}>
                  {preset.label}
                </h3>
                {profileKey === preset.key && (
                  <span className="h-2.5 w-2.5 rounded-full bg-blue" />
                )}
              </div>
              <p className="mt-1 text-[11px] text-navy-400">{preset.description}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <ProfileStat label="Users" value={preset.users} />
                <ProfileStat label="Data" value={`${preset.dataVolumeTB} TB`} />
                <ProfileStat label="Queries/day" value={preset.queriesPerDay.toLocaleString()} />
                <ProfileStat label="Storage" value={`${preset.storageGB >= 1000 ? `${preset.storageGB / 1000} TB` : `${preset.storageGB} GB`}`} />
              </div>
            </button>
          ))}

          {/* Custom option */}
          <button
            onClick={() => setProfileKey("custom")}
            className={cn(
              "nav-transition rounded-xl border p-4 text-left",
              profileKey === "custom"
                ? "border-blue bg-blue-50/50 shadow-sm"
                : "border-navy-100 border-dashed hover:border-blue-200"
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className={cn("text-sm font-semibold", profileKey === "custom" ? "text-blue" : "text-navy")}>
                Custom
              </h3>
              <Wrench size={14} className={profileKey === "custom" ? "text-blue" : "text-navy-300"} />
            </div>
            <p className="mt-1 text-[11px] text-navy-400">Define your exact workload parameters</p>
          </button>
        </div>

        {/* Custom sliders */}
        {profileKey === "custom" && (
          <div className="mt-5 grid gap-4 rounded-lg border border-blue-100 bg-blue-50/20 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <SliderInput label="Users" value={customProfile.users} min={1} max={2000} step={1} onChange={(v) => updateCustom("users", v)} />
            <SliderInput label="Data Volume (TB)" value={customProfile.dataVolumeTB} min={0.1} max={200} step={0.1} onChange={(v) => updateCustom("dataVolumeTB", v)} />
            <SliderInput label="Queries / Day" value={customProfile.queriesPerDay} min={100} max={500000} step={100} onChange={(v) => updateCustom("queriesPerDay", v)} />
            <SliderInput label="Storage (GB)" value={customProfile.storageGB} min={10} max={100000} step={10} onChange={(v) => updateCustom("storageGB", v)} />
            <SliderInput label="Egress (GB/mo)" value={customProfile.egressGB} min={0} max={50000} step={10} onChange={(v) => updateCustom("egressGB", v)} />
            <SliderInput label="Engineering Hours/mo" value={customProfile.engineeringHours} min={0} max={500} step={5} onChange={(v) => updateCustom("engineeringHours", v)} />
          </div>
        )}
      </div>

      {/* ─── 2. Vendor Selector ────────────────────────────────── */}
      <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue" />
            <h2 className="text-lg font-semibold text-navy">Select Vendors to Compare</h2>
            <span className="text-xs text-navy-300">({selectedVendorIds.length}/4)</span>
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-navy-100 bg-white px-3 py-1.5 text-xs text-navy-500 focus:border-blue focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Selected vendor pills */}
        <div className="flex flex-wrap gap-2">
          {selectedVendors.map((v) => (
            <span
              key={v.vendorId}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-1.5 text-xs font-medium text-blue"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: v.categoryColor ?? "#2E75B6" }}
              />
              {v.vendorName}
              <span className="rounded bg-blue-100 px-1.5 py-px text-[9px]">
                {PRICING_MODEL_LABELS[v.pricingModel] ?? v.pricingModel}
              </span>
              <button onClick={() => removeVendor(v.vendorId)} className="hover:opacity-60">
                <X size={12} />
              </button>
            </span>
          ))}

          {selectedVendorIds.length < 4 && (
            <div className="relative">
              <button
                onClick={() => setVendorDropdownOpen(!vendorDropdownOpen)}
                className="nav-transition inline-flex items-center gap-1 rounded-lg border border-dashed border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-400 hover:border-blue hover:text-blue"
              >
                <Plus size={12} />
                Add Vendor
              </button>
              {vendorDropdownOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 max-h-72 w-72 overflow-y-auto rounded-lg border border-navy-100 bg-white py-1 shadow-lg">
                  {availableVendors.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-navy-300">No more vendors available</p>
                  ) : (
                    availableVendors.map((v) => (
                      <button
                        key={v.vendorId}
                        onClick={() => addVendor(v.vendorId)}
                        className="nav-transition flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-navy-50"
                      >
                        <div>
                          <span className="font-medium text-navy">{v.vendorName}</span>
                          <span className="ml-2 text-navy-300">{v.category}</span>
                        </div>
                        <span className="rounded bg-navy-50 px-1.5 py-px text-[9px] text-navy-400">
                          {PRICING_MODEL_LABELS[v.pricingModel] ?? v.pricingModel}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── 3. Cost Comparison Table ──────────────────────────── */}
      {costEstimates.length > 0 && (
        <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-blue" />
              <h2 className="text-lg font-semibold text-navy">Cost Comparison</h2>
            </div>
            {/* View mode toggle */}
            <div className="inline-flex rounded-lg border border-navy-100">
              {(["monthly", "annual", "threeYear"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "nav-transition px-3 py-1.5 text-xs font-medium",
                    viewMode === mode
                      ? "bg-blue text-white"
                      : "text-navy-400 hover:bg-navy-50",
                    mode === "monthly" && "rounded-l-lg",
                    mode === "threeYear" && "rounded-r-lg"
                  )}
                >
                  {mode === "monthly" ? "Monthly" : mode === "annual" ? "Annual" : "3-Year TCO"}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50/60">
                  <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                    Cost Component
                  </th>
                  {costEstimates.map((est) => (
                    <th key={est.vendorId} className="px-4 py-3 text-center">
                      <div className="text-xs font-semibold text-navy">{est.vendorName}</div>
                      <div className="mt-0.5 text-[9px] text-navy-300">
                        {PRICING_MODEL_LABELS[est.pricingModel] ?? est.pricingModel}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CostRow label="Compute" icon={Zap} estimates={costEstimates} field="compute" viewMode={viewMode} />
                <CostRow label="Storage" icon={HardDrive} estimates={costEstimates} field="storage" viewMode={viewMode} />
                <CostRow label="Seats / Licenses" icon={Users} estimates={costEstimates} field="seats" viewMode={viewMode} />
                <CostRow label="Support" icon={Headphones} estimates={costEstimates} field="support" viewMode={viewMode} />
                <CostRow label="Data Egress" icon={ArrowUpRight} estimates={costEstimates} field="egress" viewMode={viewMode} />
                <CostRow label="Other" icon={Database} estimates={costEstimates} field="other" viewMode={viewMode} />
                {/* Total row */}
                <tr className="border-t-2 border-navy-200 bg-navy-50/40">
                  <td className="px-6 py-3">
                    <span className="text-sm font-bold text-navy">TOTAL</span>
                  </td>
                  {costEstimates.map((est) => {
                    const costs = est[viewMode];
                    const min = Math.min(...costEstimates.map((e) => e[viewMode].total));
                    const isLowest = costs.total === min && costEstimates.length > 1;
                    return (
                      <td key={est.vendorId} className="px-4 py-3 text-center">
                        <span className={cn("text-lg font-bold", isLowest ? "text-emerald-600" : "text-navy")}>
                          ${costs.total.toLocaleString()}
                        </span>
                        {isLowest && (
                          <span className="mt-0.5 block text-[9px] font-medium text-emerald-600">
                            Lowest Cost
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Per-vendor summary cards */}
          <div className="grid gap-3 border-t border-navy-100 p-6 sm:grid-cols-2 lg:grid-cols-4">
            {costEstimates.map((est) => {
              const monthlyTotal = est.monthly.total;
              const annualSavings = (monthlyTotal * 12) - est.annual.total;
              return (
                <div key={est.vendorId} className="rounded-lg border border-navy-50 p-4">
                  <Link href={`/vendors/${est.vendorSlug}`} className="text-sm font-semibold text-navy hover:text-blue">
                    {est.vendorName}
                  </Link>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-navy-400">Monthly</span>
                      <span className="font-medium text-navy">${est.monthly.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-navy-400">Annual</span>
                      <span className="font-medium text-navy">${est.annual.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-navy-400">3-Year TCO</span>
                      <span className="font-medium text-navy">${est.threeYear.total.toLocaleString()}</span>
                    </div>
                  </div>
                  {annualSavings > 0 && (
                    <p className="mt-2 text-[10px] text-emerald-600">
                      Save ${annualSavings.toLocaleString()}/yr with annual commitment
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {costEstimates.length === 0 && (
        <div className="rounded-xl border border-navy-100 bg-white p-12 text-center shadow-sm">
          <Calculator size={40} className="mx-auto text-navy-200" />
          <h3 className="mt-3 text-sm font-semibold text-navy">Select Vendors to Compare</h3>
          <p className="mt-1 text-xs text-navy-400">
            Choose up to 4 vendors above to see a side-by-side cost comparison
          </p>
        </div>
      )}

      {/* ─── 4. Hidden Costs Warnings ──────────────────────────── */}
      {allHiddenCosts.length > 0 && (
        <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-navy-100 px-6 py-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="text-lg font-semibold text-navy">Hidden Cost Warnings</h2>
            <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              {allHiddenCosts.length} items
            </span>
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {allHiddenCosts.map((hc, i) => {
              const HcIcon = HIDDEN_COST_ICONS[hc.type] ?? AlertTriangle;
              const colorCls = HIDDEN_COST_COLORS[hc.estimatedImpact];
              return (
                <div
                  key={i}
                  className={cn("rounded-lg border p-4", colorCls)}
                >
                  <div className="flex items-start gap-2.5">
                    <HcIcon size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold">{hc.title}</h4>
                      <p className="mt-1 text-[11px] leading-relaxed opacity-80">
                        {hc.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="rounded-full bg-white/60 px-2 py-0.5 text-[9px] font-bold uppercase">
                          {hc.estimatedImpact} impact
                        </span>
                        {hc.estimatedCost !== undefined && (
                          <span className="text-[10px] font-semibold">
                            ~${hc.estimatedCost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 5. Cost Formula Reference ─────────────────────────── */}
      <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-navy-100 px-6 py-4">
          <Info size={18} className="text-blue" />
          <h2 className="text-lg font-semibold text-navy">Cost Formula Reference</h2>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <FormulaCard
            model="Usage-Based"
            formula="volume × rate"
            description="Pay per TB processed, GB stored, and queries executed. Scales linearly with usage."
            example="50 TB × $5/TB = $250 compute"
            color="#2E75B6"
          />
          <FormulaCard
            model="Seat-Based"
            formula="users × seat_price"
            description="Fixed per-user license fee plus minimal usage charges. Predictable costs."
            example="50 users × $45/mo = $2,250"
            color="#10b981"
          />
          <FormulaCard
            model="Credit-Based"
            formula="operations × credit_rate"
            description="Pre-purchased credits consumed per operation. Volume discounts available."
            example="150K ops × $0.035 = $5,250"
            color="#f59e0b"
          />
          <FormulaCard
            model="Free / OSS"
            formula="hosting + eng_hrs × rate"
            description="No license fees but requires infrastructure costs and engineering time."
            example="$1,150 hosting + 100h × $85 = $9,650"
            color="#8b5cf6"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function ProfileStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-medium text-navy-300">{label}</p>
      <p className="font-semibold text-navy">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-medium text-navy-500">{label}</label>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 rounded border border-navy-200 px-2 py-1 text-right text-xs font-semibold text-navy focus:border-blue focus:outline-none"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-navy-100 accent-blue [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue [&::-webkit-slider-thumb]:shadow-md"
      />
      <div className="mt-0.5 flex justify-between text-[9px] text-navy-300">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

function CostRow({
  label,
  icon: Icon,
  estimates,
  field,
  viewMode,
}: {
  label: string;
  icon: typeof Zap;
  estimates: VendorCostEstimate[];
  field: keyof Omit<VendorCostEstimate["monthly"], "total">;
  viewMode: "monthly" | "annual" | "threeYear";
}) {
  return (
    <tr className="border-b border-navy-50">
      <td className="px-6 py-3">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-navy-500">
          <Icon size={13} className="text-navy-400" />
          {label}
        </span>
      </td>
      {estimates.map((est) => {
        const value = est[viewMode][field];
        return (
          <td key={est.vendorId} className="px-4 py-3 text-center">
            <span className={cn("text-xs font-medium", value > 0 ? "text-navy" : "text-navy-200")}>
              {value > 0 ? `$${value.toLocaleString()}` : "—"}
            </span>
          </td>
        );
      })}
    </tr>
  );
}

function FormulaCard({
  model,
  formula,
  description,
  example,
  color,
}: {
  model: string;
  formula: string;
  description: string;
  example: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-navy-50 p-4">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <h4 className="text-xs font-semibold text-navy">{model}</h4>
      </div>
      <div className="mt-2 rounded-md bg-navy-50 px-3 py-2">
        <code className="text-xs font-bold text-navy" style={{ color }}>
          {formula}
        </code>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-navy-400">{description}</p>
      <p className="mt-2 rounded bg-navy-50/60 px-2 py-1 text-[10px] text-navy-500">
        <span className="font-medium">Example:</span> {example}
      </p>
    </div>
  );
}
