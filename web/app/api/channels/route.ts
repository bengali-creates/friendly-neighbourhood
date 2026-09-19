import { NextResponse } from "next/server";
import { db } from "@/db";
import { notificationChannels } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const enabledOnly = searchParams.get("enabled") === "true";

    let query = db.select().from(notificationChannels).orderBy(desc(notificationChannels.createdAt));

    const rows = await query;
    const filtered = enabledOnly ? rows.filter((r) => r.enabled) : rows;

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("[Channels API GET Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, provider, name, enabled = true, config } = body;

    if (!provider || !name || !config) {
      return NextResponse.json(
        { success: false, error: "Provider, name, and config are required." },
        { status: 400 }
      );
    }

    if (id) {
      const updated = await db
        .update(notificationChannels)
        .set({
          provider,
          name,
          enabled: Boolean(enabled),
          config,
          updatedAt: new Date(),
        })
        .where(eq(notificationChannels.id, Number(id)))
        .returning();

      return NextResponse.json({ success: true, data: updated[0], message: "Channel updated" });
    } else {
      const inserted = await db
        .insert(notificationChannels)
        .values({
          provider,
          name,
          enabled: Boolean(enabled),
          config,
        })
        .returning();

      return NextResponse.json({ success: true, data: inserted[0], message: "Channel created" });
    }
  } catch (error: any) {
    console.error("[Channels API POST Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");

    let id = idParam ? Number(idParam) : null;
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id ? Number(body.id) : null;
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Channel ID is required." }, { status: 400 });
    }

    await db.delete(notificationChannels).where(eq(notificationChannels.id, id));
    return NextResponse.json({ success: true, message: `Channel ${id} deleted` });
  } catch (error: any) {
    console.error("[Channels API DELETE Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
