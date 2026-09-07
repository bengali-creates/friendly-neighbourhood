import { NextResponse } from "next/server";
import { db } from "@/db";
import { collectors, healEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

  
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (url) {
      const existing = await db.select().from(collectors).where(eq(collectors.url, url)).limit(1);
      if (existing.length > 0) {
        return NextResponse.json({ success: true, found: true, data: existing[0] });
      }
      return NextResponse.json({ success: true, found: false, data: null });
    }

      
    const all = await db.select().from(collectors).orderBy(desc(collectors.createdAt));

    const enriched = await Promise.all(
      all.map(async (c) => {
        const heals = await db
          .select()
          .from(healEvents)
          .where(eq(healEvents.collectorId, c.collectorId))
          .orderBy(desc(healEvents.healedAt))
          .limit(1);
        return {
          ...c,
          healCount: heals.length,
          lastHealedAt: heals[0]?.healedAt ?? null,
          lastHealType: (heals[0] as any)?.healType ?? null,
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

  
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { collector_id, name, url, source_type, target_selector, last_etag, last_content_hash } = body;

    const valuesToSet: Record<string, any> = {
      collectorId: collector_id,
      name,
      url,
      sourceType: source_type,
    };
    if (target_selector !== undefined) valuesToSet.targetSelector = target_selector;
    if (last_etag !== undefined) valuesToSet.lastEtag = last_etag;
    if (last_content_hash !== undefined) valuesToSet.lastContentHash = last_content_hash;

    const created = await db
      .insert(collectors)
      .values({
        collectorId: collector_id,
        name,
        url,
        sourceType: source_type,
        targetSelector: target_selector ?? null,
        lastEtag: last_etag ?? null,
        lastContentHash: last_content_hash ?? null,
      })
      .onConflictDoUpdate({
        target: collectors.url,
        set: valuesToSet,
      })
      .returning();

    return NextResponse.json({ success: true, data: created[0] ?? null });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

