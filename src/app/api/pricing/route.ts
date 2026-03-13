import { NextResponse } from "next/server";
import { WORKLOAD_PRESETS, calculateVendorCost } from "@/lib/scoring/pricing-engine";
import type { WorkloadProfile, VendorPricingProfile } from "@/lib/scoring/pricing-engine";

interface PricingRequest {
  vendors: VendorPricingProfile[];
  profile?: Partial<WorkloadProfile> & { key?: string };
}

export async function POST(request: Request) {
  try {
    const body: PricingRequest = await request.json();

    // Resolve workload profile
    let profile: WorkloadProfile;
    if (body.profile?.key && body.profile.key !== "custom") {
      const preset = WORKLOAD_PRESETS.find((p) => p.key === body.profile!.key);
      if (!preset) {
        return NextResponse.json({ error: "Invalid profile key" }, { status: 400 });
      }
      profile = preset;
    } else if (body.profile) {
      profile = {
        key: "custom",
        label: "Custom",
        description: "API-submitted custom profile",
        users: body.profile.users ?? 50,
        dataVolumeTB: body.profile.dataVolumeTB ?? 5,
        queriesPerDay: body.profile.queriesPerDay ?? 5000,
        storageGB: body.profile.storageGB ?? 2000,
        egressGB: body.profile.egressGB ?? 500,
        engineeringHours: body.profile.engineeringHours ?? 80,
      };
    } else {
      profile = WORKLOAD_PRESETS[1]; // default: medium
    }

    if (!body.vendors || body.vendors.length === 0) {
      return NextResponse.json({ error: "At least one vendor required" }, { status: 400 });
    }

    const estimates = body.vendors.map((v) => calculateVendorCost(v, profile));

    return NextResponse.json({
      profile: { key: profile.key, label: profile.label },
      estimates,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
