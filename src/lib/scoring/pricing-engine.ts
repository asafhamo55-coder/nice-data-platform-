/**
 * Pricing Calculation Engine
 *
 * Cost formula per pricing model:
 *   usage-based:  volume × rate
 *   seat-based:   users × seat_price
 *   credit-based: estimated_operations × credit_rate
 *   free/oss:     hosting_cost + engineering_hours × hourly_rate
 *   enterprise:   base_fee + usage surcharges
 */

// ─── Types ──────────────────────────────────────────────────────

export interface WorkloadProfile {
  key: string;
  label: string;
  description: string;
  users: number;
  dataVolumeTB: number;
  queriesPerDay: number;
  storageGB: number;
  egressGB: number;
  engineeringHours: number; // for self-hosted/OSS
}

export interface VendorPricingProfile {
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  tier: string;
  pricingModel: string; // usage-based, seat-based, credit-based, free, enterprise, open-source, freemium, pay-as-you-go
  category: string;
}

export interface CostBreakdown {
  compute: number;
  storage: number;
  seats: number;
  support: number;
  egress: number;
  other: number;
  total: number;
}

export interface VendorCostEstimate {
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  tier: string;
  pricingModel: string;
  monthly: CostBreakdown;
  annual: CostBreakdown;
  threeYear: CostBreakdown;
  hiddenCosts: HiddenCost[];
}

export interface HiddenCost {
  type: "egress" | "training" | "migration" | "support" | "overage";
  title: string;
  description: string;
  estimatedImpact: "low" | "medium" | "high";
  estimatedCost?: number;
}

// ─── Preset workload profiles ───────────────────────────────────

export const WORKLOAD_PRESETS: WorkloadProfile[] = [
  {
    key: "small",
    label: "Small Team",
    description: "Startup or small team, light analytical workloads",
    users: 10,
    dataVolumeTB: 0.5,
    queriesPerDay: 500,
    storageGB: 100,
    egressGB: 50,
    engineeringHours: 20,
  },
  {
    key: "medium",
    label: "Mid-Market",
    description: "Growing company, moderate data and user load",
    users: 50,
    dataVolumeTB: 5,
    queriesPerDay: 5000,
    storageGB: 2000,
    egressGB: 500,
    engineeringHours: 80,
  },
  {
    key: "large",
    label: "Enterprise",
    description: "Large org, high-volume data processing at scale",
    users: 500,
    dataVolumeTB: 50,
    queriesPerDay: 100000,
    storageGB: 50000,
    egressGB: 5000,
    engineeringHours: 200,
  },
];

// ─── Pricing rate tables per model ──────────────────────────────

interface RateTable {
  computePerTB: number;     // cost per TB of data processed
  storagePerGB: number;     // cost per GB stored per month
  seatPrice: number;        // cost per user per month
  supportPct: number;       // support as % of total
  egressPerGB: number;      // egress cost per GB
  creditRate: number;       // cost per 1000 operations (for credit-based)
  baseFee: number;          // monthly base fee (for enterprise)
  engineeringRate: number;  // hourly rate for self-hosted engineering
}

function getRateTable(pricingModel: string, tier: string): RateTable {
  const tierMultiplier = tier === "leader" ? 1.3 : tier === "challenger" ? 1.0 : tier === "emerging" ? 0.75 : 0.6;

  switch (pricingModel) {
    case "usage-based":
    case "pay-as-you-go":
      return {
        computePerTB: 5 * tierMultiplier,
        storagePerGB: 0.023 * tierMultiplier,
        seatPrice: 0,
        supportPct: 0.1,
        egressPerGB: 0.09,
        creditRate: 0,
        baseFee: 0,
        engineeringRate: 0,
      };
    case "seat-based":
      return {
        computePerTB: 2 * tierMultiplier,
        storagePerGB: 0.01 * tierMultiplier,
        seatPrice: 45 * tierMultiplier,
        supportPct: 0.15,
        egressPerGB: 0.05,
        creditRate: 0,
        baseFee: 0,
        engineeringRate: 0,
      };
    case "credit-based":
      return {
        computePerTB: 3 * tierMultiplier,
        storagePerGB: 0.02 * tierMultiplier,
        seatPrice: 0,
        supportPct: 0.1,
        egressPerGB: 0.08,
        creditRate: 0.35 * tierMultiplier,
        baseFee: 0,
        engineeringRate: 0,
      };
    case "free":
    case "open-source":
      return {
        computePerTB: 0,
        storagePerGB: 0.023,
        seatPrice: 0,
        supportPct: 0,
        egressPerGB: 0.09,
        creditRate: 0,
        baseFee: 0,
        engineeringRate: 85,
      };
    case "freemium":
      return {
        computePerTB: 3 * tierMultiplier,
        storagePerGB: 0.015 * tierMultiplier,
        seatPrice: 15 * tierMultiplier,
        supportPct: 0.1,
        egressPerGB: 0.06,
        creditRate: 0,
        baseFee: 0,
        engineeringRate: 0,
      };
    case "enterprise":
    default:
      return {
        computePerTB: 4 * tierMultiplier,
        storagePerGB: 0.02 * tierMultiplier,
        seatPrice: 30 * tierMultiplier,
        supportPct: 0.2,
        egressPerGB: 0.07,
        creditRate: 0,
        baseFee: 2000 * tierMultiplier,
        engineeringRate: 0,
      };
  }
}

// ─── Cost calculation ───────────────────────────────────────────

function calculateMonthly(
  profile: WorkloadProfile,
  rates: RateTable,
  pricingModel: string
): CostBreakdown {
  let compute = 0;
  let storage = 0;
  let seats = 0;
  let egress = 0;
  let other = 0;

  switch (pricingModel) {
    case "usage-based":
    case "pay-as-you-go":
      // volume × rate
      compute = profile.dataVolumeTB * rates.computePerTB * 1000; // TB → cost
      storage = profile.storageGB * rates.storagePerGB;
      egress = profile.egressGB * rates.egressPerGB;
      break;

    case "seat-based":
      // users × seat_price
      seats = profile.users * rates.seatPrice;
      compute = profile.dataVolumeTB * rates.computePerTB * 100;
      storage = profile.storageGB * rates.storagePerGB;
      egress = profile.egressGB * rates.egressPerGB;
      break;

    case "credit-based":
      // estimated_operations × credit_rate
      compute = (profile.queriesPerDay * 30) / 1000 * rates.creditRate * 100;
      storage = profile.storageGB * rates.storagePerGB;
      egress = profile.egressGB * rates.egressPerGB;
      other = profile.dataVolumeTB * rates.computePerTB * 200;
      break;

    case "free":
    case "open-source":
      // hosting_cost + engineering_hours × hourly_rate
      storage = profile.storageGB * rates.storagePerGB;
      compute = profile.dataVolumeTB * 23; // infrastructure hosting
      egress = profile.egressGB * rates.egressPerGB;
      other = profile.engineeringHours * rates.engineeringRate;
      break;

    case "freemium":
      seats = Math.max(0, profile.users - 5) * rates.seatPrice; // 5 free users
      compute = profile.dataVolumeTB * rates.computePerTB * 200;
      storage = profile.storageGB * rates.storagePerGB;
      egress = profile.egressGB * rates.egressPerGB;
      break;

    case "enterprise":
    default:
      compute = rates.baseFee + profile.dataVolumeTB * rates.computePerTB * 300;
      seats = profile.users * rates.seatPrice;
      storage = profile.storageGB * rates.storagePerGB;
      egress = profile.egressGB * rates.egressPerGB;
      break;
  }

  const subtotal = compute + storage + seats + egress + other;
  const support = subtotal * rates.supportPct;
  const total = Math.round(subtotal + support);

  return {
    compute: Math.round(compute),
    storage: Math.round(storage),
    seats: Math.round(seats),
    support: Math.round(support),
    egress: Math.round(egress),
    other: Math.round(other),
    total,
  };
}

export function calculateVendorCost(
  vendor: VendorPricingProfile,
  profile: WorkloadProfile
): VendorCostEstimate {
  const rates = getRateTable(vendor.pricingModel, vendor.tier);
  const monthly = calculateMonthly(profile, rates, vendor.pricingModel);

  // Annual: 12 months × 0.85 (15% annual commitment discount)
  const annualMultiplier = vendor.pricingModel === "free" || vendor.pricingModel === "open-source" ? 12 : 12 * 0.85;
  const annual: CostBreakdown = {
    compute: Math.round(monthly.compute * annualMultiplier),
    storage: Math.round(monthly.storage * annualMultiplier),
    seats: Math.round(monthly.seats * annualMultiplier),
    support: Math.round(monthly.support * annualMultiplier),
    egress: Math.round(monthly.egress * annualMultiplier),
    other: Math.round(monthly.other * annualMultiplier),
    total: Math.round(monthly.total * annualMultiplier),
  };

  // 3-year TCO: annual × 3 × 0.9 (additional 10% multi-year discount) + migration estimate
  const threeYearMultiplier = vendor.pricingModel === "free" || vendor.pricingModel === "open-source" ? 3 : 3 * 0.9;
  const migrationCost = Math.round(monthly.total * 2); // ~2 months of spend for migration
  const threeYear: CostBreakdown = {
    compute: Math.round(annual.compute * threeYearMultiplier),
    storage: Math.round(annual.storage * threeYearMultiplier),
    seats: Math.round(annual.seats * threeYearMultiplier),
    support: Math.round(annual.support * threeYearMultiplier),
    egress: Math.round(annual.egress * threeYearMultiplier),
    other: Math.round(annual.other * threeYearMultiplier + migrationCost),
    total: Math.round(annual.total * threeYearMultiplier + migrationCost),
  };

  // Hidden costs
  const hiddenCosts = getHiddenCosts(vendor, profile);

  return {
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    vendorSlug: vendor.vendorSlug,
    tier: vendor.tier,
    pricingModel: vendor.pricingModel,
    monthly,
    annual,
    threeYear,
    hiddenCosts,
  };
}

// ─── Hidden cost detection ──────────────────────────────────────

function getHiddenCosts(vendor: VendorPricingProfile, profile: WorkloadProfile): HiddenCost[] {
  const costs: HiddenCost[] = [];

  // Egress fees
  if (profile.egressGB > 100) {
    costs.push({
      type: "egress",
      title: "Data Egress Fees",
      description: `${profile.egressGB} GB/mo egress can incur $${Math.round(profile.egressGB * 0.09)}/mo in transfer fees. Consider data locality and caching strategies.`,
      estimatedImpact: profile.egressGB > 1000 ? "high" : "medium",
      estimatedCost: Math.round(profile.egressGB * 0.09),
    });
  }

  // Training costs
  if (profile.users > 20) {
    const trainingCost = Math.round(profile.users * 500);
    costs.push({
      type: "training",
      title: "User Training & Onboarding",
      description: `Training ${profile.users} users on ${vendor.vendorName} typically costs $${trainingCost.toLocaleString()} (one-time). Factor in 2-4 weeks of reduced productivity.`,
      estimatedImpact: profile.users > 100 ? "high" : "medium",
      estimatedCost: trainingCost,
    });
  }

  // Migration effort
  costs.push({
    type: "migration",
    title: "Migration & Integration Effort",
    description: `Migrating ${profile.dataVolumeTB} TB of data plus rebuilding pipelines typically requires 4-12 weeks of engineering effort depending on complexity.`,
    estimatedImpact: profile.dataVolumeTB > 10 ? "high" : profile.dataVolumeTB > 1 ? "medium" : "low",
    estimatedCost: Math.round(profile.dataVolumeTB * 5000 + profile.engineeringHours * 150),
  });

  // Support tier upsell
  if (vendor.tier === "leader" || vendor.pricingModel === "enterprise") {
    costs.push({
      type: "support",
      title: "Premium Support Tier",
      description: `Enterprise support with SLAs and dedicated CSM typically adds 15-25% on top of base pricing. ${vendor.vendorName} may require premium support for production workloads.`,
      estimatedImpact: "medium",
    });
  }

  // Overage charges
  if (vendor.pricingModel === "usage-based" || vendor.pricingModel === "credit-based") {
    costs.push({
      type: "overage",
      title: "Overage & Burst Charges",
      description: `Usage-based pricing can spike during peak loads. Burst pricing is typically 1.5-3× standard rates. Budget 20-30% buffer above estimated usage.`,
      estimatedImpact: profile.queriesPerDay > 10000 ? "high" : "medium",
    });
  }

  // OSS hidden costs
  if (vendor.pricingModel === "free" || vendor.pricingModel === "open-source") {
    costs.push({
      type: "support",
      title: "Self-Managed Operations",
      description: `Open-source tools require in-house expertise for upgrades, security patches, monitoring, and troubleshooting. Budget ${profile.engineeringHours}+ engineering hours/month.`,
      estimatedImpact: "high",
      estimatedCost: profile.engineeringHours * 85,
    });
  }

  return costs;
}
