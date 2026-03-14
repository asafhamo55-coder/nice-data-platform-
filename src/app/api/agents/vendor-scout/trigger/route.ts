import { NextResponse } from "next/server";
import { scoutVendors } from "@/lib/agents/vendor-scout";

export async function POST() {
  try {
    const result = await scoutVendors();

    if (result.status === "failed") {
      return NextResponse.json(
        {
          error: result.error ?? "Vendor scout failed",
          runId: result.runId,
          durationMs: result.durationMs,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      runId: result.runId,
      categoriesScanned: result.categoriesScanned,
      newVendorsCreated: result.newVendorsCreated,
      vendorsUpdated: result.vendorsUpdated,
      githubUpdates: result.githubUpdates,
      rankingsRecalculated: result.rankingsRecalculated,
      durationMs: result.durationMs,
    });
  } catch (error) {
    console.error("Vendor scout trigger failed:", error);
    return NextResponse.json(
      { error: "Failed to trigger vendor scout" },
      { status: 500 }
    );
  }
}
