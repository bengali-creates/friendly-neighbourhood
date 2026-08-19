import { NextResponse } from "next/server";
import { db } from "@/db";
import { healEvents } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { collector_id, description, attempts } = body;

    const newHeal = await db.insert(healEvents).values({
      collectorId: collector_id,
      description,
      attempts: attempts || 1,
    }).returning();

    return NextResponse.json({ success: true, data: newHeal[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
