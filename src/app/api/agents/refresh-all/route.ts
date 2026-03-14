import { runFullRefresh } from "@/lib/agents/data-refresh-engine";
import type { RefreshStep, RefreshSummary } from "@/lib/agents/data-refresh-engine";

/**
 * POST /api/agents/refresh-all
 *
 * Streams progress of the full data refresh via Server-Sent Events.
 *
 * Event types:
 *   data: { type: "step",    ...RefreshStep }
 *   data: { type: "summary", ...RefreshSummary }
 */
export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: string) => {
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      const emit = (
        event: RefreshStep | { type: "summary"; data: RefreshSummary }
      ) => {
        if ("type" in event && event.type === "summary") {
          send(JSON.stringify({ type: "summary", ...event.data }));
        } else {
          send(JSON.stringify({ type: "step", ...(event as RefreshStep) }));
        }
      };

      try {
        await runFullRefresh(emit);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        send(JSON.stringify({ type: "error", error: msg }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
