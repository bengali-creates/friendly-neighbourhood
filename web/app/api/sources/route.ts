import { NextResponse } from "next/server";
import { db } from "@/db";
import { sources } from "@/db/schema";
import { eq } from "drizzle-orm";

  
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const alertId = searchParams.get("alert_id");

    if (!alertId) {
      return NextResponse.json({ success: false, error: "alert_id is required" }, { status: 400 });
    }

    const rows = await db.select().from(sources).where(eq(sources.alertId, parseInt(alertId)));
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

  
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { alert_id, sources: sourceList } = body;

    if (!alert_id || !Array.isArray(sourceList)) {
      return NextResponse.json({ success: false, error: "alert_id and sources[] required" }, { status: 400 });
    }

    const rows = sourceList.map((s: any) => ({
      alertId: alert_id,
      title: s.title,
      url: s.url,
      snippet: s.snippet ?? null,
      sourceType: s.source_type,
    }));

    const created = await db.insert(sources).values(rows).returning();
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
