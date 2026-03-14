import { describe, it, expect } from "vitest";
import {
  calculateVendorCost,
  WORKLOAD_PRESETS,
  type VendorPricingProfile,
  type WorkloadProfile,
} from "./pricing-engine";

// ─── Helpers ─────────────────────────────────────────────────────

function makeVendor(overrides: Partial<VendorPricingProfile> = {}): VendorPricingProfile {
  return {
    vendorId: "v1",
    vendorName: "TestVendor",
    vendorSlug: "test-vendor",
    tier: "challenger",
    pricingModel: "usage-based",
    category: "storage",
    ...overrides,
  };
}

const smallProfile = WORKLOAD_PRESETS.find((p) => p.key === "small")!;
const mediumProfile = WORKLOAD_PRESETS.find((p) => p.key === "medium")!;
const largeProfile = WORKLOAD_PRESETS.find((p) => p.key === "large")!;

// ─── Workload presets ────────────────────────────────────────────

describe("WORKLOAD_PRESETS", () => {
  it("contains 3 presets", () => {
    expect(WORKLOAD_PRESETS).toHaveLength(3);
  });

  it("has small, medium, large keys", () => {
    const keys = WORKLOAD_PRESETS.map((p) => p.key);
    expect(keys).toEqual(["small", "medium", "large"]);
  });

  it("presets have increasing scale", () => {
    expect(smallProfile.users).toBeLessThan(mediumProfile.users);
    expect(mediumProfile.users).toBeLessThan(largeProfile.users);
    expect(smallProfile.dataVolumeTB).toBeLessThan(mediumProfile.dataVolumeTB);
    expect(mediumProfile.dataVolumeTB).toBeLessThan(largeProfile.dataVolumeTB);
  });
});

// ─── calculateVendorCost ─────────────────────────────────────────

describe("calculateVendorCost", () => {
  it("returns all required cost breakdown fields", () => {
    const result = calculateVendorCost(makeVendor(), smallProfile);
    expect(result).toHaveProperty("monthly");
    expect(result).toHaveProperty("annual");
    expect(result).toHaveProperty("threeYear");
    expect(result).toHaveProperty("hiddenCosts");
    expect(result.vendorId).toBe("v1");
    expect(result.vendorName).toBe("TestVendor");

    const { monthly } = result;
    expect(monthly).toHaveProperty("compute");
    expect(monthly).toHaveProperty("storage");
    expect(monthly).toHaveProperty("seats");
    expect(monthly).toHaveProperty("support");
    expect(monthly).toHaveProperty("egress");
    expect(monthly).toHaveProperty("other");
    expect(monthly).toHaveProperty("total");
  });

  it("monthly total equals sum of components plus support", () => {
    const result = calculateVendorCost(makeVendor(), smallProfile);
    const m = result.monthly;
    const subtotal = m.compute + m.storage + m.seats + m.egress + m.other;
    // support is calculated on subtotal, total = subtotal + support
    // Due to rounding, allow ±1
    expect(Math.abs(m.total - (subtotal + m.support))).toBeLessThanOrEqual(1);
  });

  it("annual cost is less than 12x monthly for paid models (15% discount)", () => {
    const result = calculateVendorCost(makeVendor({ pricingModel: "usage-based" }), mediumProfile);
    expect(result.annual.total).toBeLessThan(result.monthly.total * 12);
    // Should be approximately 12 * 0.85 = 10.2x
    expect(result.annual.total).toBeCloseTo(result.monthly.total * 12 * 0.85, -1);
  });

  it("annual cost is exactly 12x monthly for free/open-source (no discount)", () => {
    const result = calculateVendorCost(makeVendor({ pricingModel: "open-source" }), smallProfile);
    expect(result.annual.total).toBe(result.monthly.total * 12);
  });

  it("three-year cost includes migration estimate", () => {
    const result = calculateVendorCost(makeVendor({ pricingModel: "usage-based" }), mediumProfile);
    // 3-year = annual * 3 * 0.9 + migration (~2 months spend)
    // The other field in threeYear includes migration cost
    expect(result.threeYear.total).toBeGreaterThan(0);
    expect(result.threeYear.total).toBeGreaterThan(result.annual.total * 2);
  });

  // ─── Pricing model variations ────────────────────────────────

  describe("usage-based pricing", () => {
    it("has zero seat cost", () => {
      const result = calculateVendorCost(makeVendor({ pricingModel: "usage-based" }), mediumProfile);
      expect(result.monthly.seats).toBe(0);
    });

    it("compute scales with data volume", () => {
      const small = calculateVendorCost(makeVendor({ pricingModel: "usage-based" }), smallProfile);
      const large = calculateVendorCost(makeVendor({ pricingModel: "usage-based" }), largeProfile);
      expect(large.monthly.compute).toBeGreaterThan(small.monthly.compute);
    });
  });

  describe("seat-based pricing", () => {
    it("has non-zero seat cost", () => {
      const result = calculateVendorCost(makeVendor({ pricingModel: "seat-based" }), mediumProfile);
      expect(result.monthly.seats).toBeGreaterThan(0);
    });

    it("seat cost scales with user count", () => {
      const small = calculateVendorCost(makeVendor({ pricingModel: "seat-based" }), smallProfile);
      const large = calculateVendorCost(makeVendor({ pricingModel: "seat-based" }), largeProfile);
      expect(large.monthly.seats).toBeGreaterThan(small.monthly.seats);
    });
  });

  describe("credit-based pricing", () => {
    it("has zero seat cost", () => {
      const result = calculateVendorCost(makeVendor({ pricingModel: "credit-based" }), mediumProfile);
      expect(result.monthly.seats).toBe(0);
    });

    it("compute relates to query volume", () => {
      const result = calculateVendorCost(makeVendor({ pricingModel: "credit-based" }), largeProfile);
      expect(result.monthly.compute).toBeGreaterThan(0);
    });
  });

  describe("open-source pricing", () => {
    it("has engineering hours as 'other' cost", () => {
      const result = calculateVendorCost(makeVendor({ pricingModel: "open-source" }), mediumProfile);
      expect(result.monthly.other).toBeGreaterThan(0);
      // engineeringHours(80) * rate(85) = 6800
      expect(result.monthly.other).toBe(80 * 85);
    });

    it("has zero seat cost", () => {
      const result = calculateVendorCost(makeVendor({ pricingModel: "open-source" }), smallProfile);
      expect(result.monthly.seats).toBe(0);
    });

    it("has zero support cost", () => {
      const result = calculateVendorCost(makeVendor({ pricingModel: "open-source" }), smallProfile);
      expect(result.monthly.support).toBe(0);
    });
  });

  describe("enterprise pricing", () => {
    it("includes a base fee in compute", () => {
      const result = calculateVendorCost(makeVendor({ pricingModel: "enterprise" }), smallProfile);
      // baseFee = 2000 * tierMultiplier(1.0) = 2000
      expect(result.monthly.compute).toBeGreaterThanOrEqual(2000);
    });

    it("includes seat costs", () => {
      const result = calculateVendorCost(makeVendor({ pricingModel: "enterprise" }), mediumProfile);
      expect(result.monthly.seats).toBeGreaterThan(0);
    });
  });

  describe("freemium pricing", () => {
    it("gives 5 free users", () => {
      // Small profile has 10 users, so only 5 are charged
      const result = calculateVendorCost(makeVendor({ pricingModel: "freemium" }), smallProfile);
      // With 10 users, 5 free → 5 paid
      expect(result.monthly.seats).toBeGreaterThan(0);

      // Custom profile with exactly 5 users → 0 seat cost
      const freeProfile: WorkloadProfile = { ...smallProfile, users: 5 };
      const freeResult = calculateVendorCost(makeVendor({ pricingModel: "freemium" }), freeProfile);
      expect(freeResult.monthly.seats).toBe(0);
    });
  });

  // ─── Tier multiplier effects ─────────────────────────────────

  describe("tier pricing tiers", () => {
    it("leader tier costs more than challenger", () => {
      const leader = calculateVendorCost(makeVendor({ tier: "leader" }), mediumProfile);
      const challenger = calculateVendorCost(makeVendor({ tier: "challenger" }), mediumProfile);
      expect(leader.monthly.total).toBeGreaterThan(challenger.monthly.total);
    });

    it("emerging tier costs less than challenger", () => {
      const emerging = calculateVendorCost(makeVendor({ tier: "emerging" }), mediumProfile);
      const challenger = calculateVendorCost(makeVendor({ tier: "challenger" }), mediumProfile);
      expect(emerging.monthly.total).toBeLessThan(challenger.monthly.total);
    });
  });

  // ─── Hidden costs ────────────────────────────────────────────

  describe("hidden costs", () => {
    it("always includes migration cost", () => {
      const result = calculateVendorCost(makeVendor(), smallProfile);
      const migrationCost = result.hiddenCosts.find((c) => c.type === "migration");
      expect(migrationCost).toBeDefined();
      expect(migrationCost!.title).toContain("Migration");
    });

    it("includes egress warning when egressGB > 100", () => {
      const highEgress: WorkloadProfile = { ...smallProfile, egressGB: 500 };
      const result = calculateVendorCost(makeVendor(), highEgress);
      const egressCost = result.hiddenCosts.find((c) => c.type === "egress");
      expect(egressCost).toBeDefined();
      expect(egressCost!.estimatedImpact).toBe("medium");
    });

    it("marks egress as high impact when > 1000 GB", () => {
      const veryHighEgress: WorkloadProfile = { ...smallProfile, egressGB: 2000 };
      const result = calculateVendorCost(makeVendor(), veryHighEgress);
      const egressCost = result.hiddenCosts.find((c) => c.type === "egress");
      expect(egressCost!.estimatedImpact).toBe("high");
    });

    it("includes training cost when users > 20", () => {
      const result = calculateVendorCost(makeVendor(), mediumProfile); // 50 users
      const training = result.hiddenCosts.find((c) => c.type === "training");
      expect(training).toBeDefined();
      expect(training!.estimatedCost).toBe(50 * 500);
    });

    it("does not include training cost when users <= 20", () => {
      const result = calculateVendorCost(makeVendor(), smallProfile); // 10 users
      const training = result.hiddenCosts.find((c) => c.type === "training");
      expect(training).toBeUndefined();
    });

    it("includes support upsell for leader tier", () => {
      const result = calculateVendorCost(makeVendor({ tier: "leader" }), smallProfile);
      const support = result.hiddenCosts.find((c) => c.type === "support" && c.title.includes("Premium"));
      expect(support).toBeDefined();
    });

    it("includes overage warning for usage-based pricing", () => {
      const result = calculateVendorCost(makeVendor({ pricingModel: "usage-based" }), mediumProfile);
      const overage = result.hiddenCosts.find((c) => c.type === "overage");
      expect(overage).toBeDefined();
    });

    it("includes self-managed ops for open-source", () => {
      const result = calculateVendorCost(makeVendor({ pricingModel: "open-source" }), smallProfile);
      const selfManaged = result.hiddenCosts.find((c) => c.type === "support" && c.title.includes("Self-Managed"));
      expect(selfManaged).toBeDefined();
      expect(selfManaged!.estimatedCost).toBe(smallProfile.engineeringHours * 85);
    });
  });

  // ─── All cost values are non-negative integers ───────────────

  it("all cost values are non-negative integers", () => {
    for (const preset of WORKLOAD_PRESETS) {
      for (const model of ["usage-based", "seat-based", "credit-based", "free", "open-source", "enterprise", "freemium"]) {
        const result = calculateVendorCost(makeVendor({ pricingModel: model }), preset);
        for (const period of [result.monthly, result.annual, result.threeYear]) {
          expect(period.compute).toBeGreaterThanOrEqual(0);
          expect(period.storage).toBeGreaterThanOrEqual(0);
          expect(period.seats).toBeGreaterThanOrEqual(0);
          expect(period.support).toBeGreaterThanOrEqual(0);
          expect(period.egress).toBeGreaterThanOrEqual(0);
          expect(period.other).toBeGreaterThanOrEqual(0);
          expect(period.total).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(period.total)).toBe(true);
        }
      }
    }
  });
});
