import { NextResponse } from "next/server";
import { db } from "@/db";
import { alerts } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(50);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { collector_id, severity, message, draft_script, category, position_a, position_b } = body;

    const newAlert = await db.insert(alerts).values({
      collectorId: collector_id,
      severity,
      message,
      draftScript: draft_script,
      positionA: position_a ?? null,
      positionB: position_b ?? null,
      category: category || "general",
    }).returning();

    
    
    return NextResponse.json({ success: true, data: newAlert[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

