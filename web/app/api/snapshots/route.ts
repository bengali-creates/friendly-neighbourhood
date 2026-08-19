import { NextResponse } from "next/server";
import { db } from "@/db";
import { snapshots } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { collector_id, url, text, raw } = body;

    const newSnapshot = await db.insert(snapshots).values({
      collectorId: collector_id,
      url,
      text,
      raw,
    }).returning();

    return NextResponse.json({ success: true, data: newSnapshot[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
