import { NextResponse } from "next/server";
import { db } from "@/db";
import { snapshots } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

  
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const collectorId = searchParams.get("collector_id");
    const url = searchParams.get("url");

    let rows;
    if (collectorId) {
      rows = await db
        .select()
        .from(snapshots)
        .where(eq(snapshots.collectorId, collectorId))
        .orderBy(desc(snapshots.scrapedAt))
        .limit(10);
    } else if (url) {
      rows = await db
        .select()
        .from(snapshots)
        .where(eq(snapshots.url, url))
        .orderBy(desc(snapshots.scrapedAt))
        .limit(1);
    } else {
      rows = await db.select().from(snapshots).orderBy(desc(snapshots.scrapedAt)).limit(50);
    }

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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
