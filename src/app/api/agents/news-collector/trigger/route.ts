import { NextResponse } from "next/server";
import { collectNews } from "@/lib/agents/news-collector";

export async function POST() {
  try {
    const result = await collectNews();

    if (result.status === "failed") {
      return NextResponse.json(
        {
          error: result.error ?? "News collection failed",
          runId: result.runId,
          durationMs: result.durationMs,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      runId: result.runId,
      collected: result.collected,
      duplicatesSkipped: result.duplicatesSkipped,
      totalInDb: result.totalInDb,
      durationMs: result.durationMs,
    });
  } catch (error) {
    console.error("News collector trigger failed:", error);
    return NextResponse.json(
      { error: "Failed to trigger news collection" },
      { status: 500 }
    );
  }
}
