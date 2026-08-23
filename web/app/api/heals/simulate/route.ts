import { NextResponse } from "next/server";
import { db } from "@/db";
import { healEvents, collectors } from "@/db/schema";

const SIMULATED_EVENTS = [
  {
    heal_type: "network",
    description: "HTTP 403 Forbidden — Cloudflare bot detection triggered",
    resolution: "Bright Data rotated to residential proxy pool (US-East). Retry succeeded in 8.4s.",
    attempts: 1,
    duration_ms: 8400,
    succeeded: true,
  },
  {
    heal_type: "network",
    description: "Rate limit hit — 429 Too Many Requests after 12 consecutive requests",
    resolution: "Bright Data switched to rotating datacenter IPs with 3s exponential backoff. Recovered after 2 retries.",
    attempts: 2,
    duration_ms: 14200,
    succeeded: true,
  },
  {
    heal_type: "extraction",
    description: "LLM returned malformed JSON — response truncated mid-object",
    resolution: "Retried with stricter prompt: 'Return ONLY valid JSON, no prose'. Extraction succeeded on attempt 2.",
    attempts: 2,
    duration_ms: 3800,
    succeeded: true,
  },
  {
    heal_type: "extraction",
    description: "Snapshot returned null — collector matched zero fields after HTML structure change",
    resolution: "Bright Data self-heal triggered: re-analyzed DOM selectors. New selectors deployed automatically.",
    attempts: 1,
    duration_ms: 22000,
    succeeded: true,
  },
  {
    heal_type: "diff",
    description: "Diff algorithm failed — previous snapshot was empty string, cannot compute unified diff",
    resolution: "Baseline snapshot reset. Current snapshot stored as new baseline for next cycle.",
    attempts: 1,
    duration_ms: 120,
    succeeded: true,
  },
  {
    heal_type: "network",
    description: "CAPTCHA challenge detected on target page before content load",
    resolution: "Bright Data CAPTCHA solver activated. Page rendered via headless browser. Content extracted.",
    attempts: 1,
    duration_ms: 11600,
    succeeded: true,
  },
  {
    heal_type: "extraction",
    description: "Gemini API timeout after 30s — response not received for diff classification",
    resolution: "Retried with gemini-3.6-flash model fallback. Severity classification completed on attempt 2.",
    attempts: 2,
    duration_ms: 34500,
    succeeded: true,
  },
];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const count = Math.min(body.count ?? 3, SIMULATED_EVENTS.length);

      
    const allCollectors = await db.select().from(collectors).limit(1);
    const collectorId = allCollectors[0]?.collectorId ?? "c_demo_test_01";

    const toInsert = SIMULATED_EVENTS
      .slice(0, count)
      .map((ev) => ({
        collectorId,
        description: ev.description,
        healType: ev.heal_type,
        resolution: ev.resolution,
        attempts: ev.attempts,
        durationMs: ev.duration_ms,
        succeeded: ev.succeeded,
      }));

    const inserted = await db.insert(healEvents).values(toInsert).returning();

    return NextResponse.json({
      success: true,
      message: `Simulated ${inserted.length} heal events for collector ${collectorId}`,
      data: inserted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
