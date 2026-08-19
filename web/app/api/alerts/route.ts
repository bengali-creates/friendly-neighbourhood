import { NextResponse } from "next/server";
import { db } from "@/db";
import { alerts } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { collector_id, severity, message, draft_script, category } = body;

    const newAlert = await db.insert(alerts).values({
      collectorId: collector_id,
      severity,
      message,
      draftScript: draft_script,
      category: category || "general",
    }).returning();

    return NextResponse.json({ success: true, data: newAlert[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
