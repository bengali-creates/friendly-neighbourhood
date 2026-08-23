import { NextResponse } from "next/server";
import { db } from "@/db";
import { collectors, healEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ collectorId: string }> };

  
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { collectorId } = await params;

      
    await db.delete(healEvents).where(eq(healEvents.collectorId, collectorId));

      
    const deleted = await db
      .delete(collectors)
      .where(eq(collectors.collectorId, collectorId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ success: false, error: "Collector not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deleted[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

  
export async function GET(_req: Request, { params }: Params) {
  try {
    const { collectorId } = await params;

    const collector = await db
      .select()
      .from(collectors)
      .where(eq(collectors.collectorId, collectorId))
      .limit(1);

    if (collector.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const heals = await db
      .select()
      .from(healEvents)
      .where(eq(healEvents.collectorId, collectorId))
      .orderBy(healEvents.healedAt);

    return NextResponse.json({
      success: true,
      data: { ...collector[0], heals },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

