import { NextResponse } from "next/server";
import { db } from "@/db";
import { healEvents, collectors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

  
export async function GET() {
  try {
    const events = await db
      .select({
        id: healEvents.id,
        collectorId: healEvents.collectorId,
        description: healEvents.description,
        healType: healEvents.healType,
        resolution: healEvents.resolution,
        attempts: healEvents.attempts,
        durationMs: healEvents.durationMs,
        succeeded: healEvents.succeeded,
        healedAt: healEvents.healedAt,
          
        collectorName: collectors.name,
        collectorUrl: collectors.url,
        sourceType: collectors.sourceType,
      })
      .from(healEvents)
      .leftJoin(collectors, eq(healEvents.collectorId, collectors.collectorId))
      .orderBy(desc(healEvents.healedAt))
      .limit(100);

    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

  
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      collector_id,
      description,
      heal_type = "extraction",
      resolution,
      attempts = 1,
      duration_ms,
      succeeded = true,
    } = body;

    const newHeal = await db.insert(healEvents).values({
      collectorId: collector_id,
      description,
      healType: heal_type,
      resolution,
      attempts,
      durationMs: duration_ms,
      succeeded,
    }).returning();

    return NextResponse.json({ success: true, data: newHeal[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
