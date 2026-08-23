import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const data = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    const unreadCount = data.filter((n) => !n.read).length;

    return NextResponse.json({ success: true, unreadCount, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, title, message, type, collector_id } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Title and message are required" }, { status: 400 });
    }

    const inserted = await db
      .insert(notifications)
      .values({
        userId: user_id ?? null,
        title,
        message,
        type: type || "info",
        collectorId: collector_id ?? null,
        read: false,
      })
      .returning();

    return NextResponse.json({ success: true, data: inserted[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await db.update(notifications).set({ read: true }).where(eq(notifications.read, false));
    } else if (id) {
      await db.update(notifications).set({ read: true }).where(eq(notifications.id, Number(id)));
    }

    return NextResponse.json({ success: true, message: "Notifications updated" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
