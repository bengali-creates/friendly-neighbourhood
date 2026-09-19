import { NextResponse } from "next/server";
import { db } from "@/db";
import { channelLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const logs = await db
      .select()
      .from(channelLogs)
      .orderBy(desc(channelLogs.createdAt))
      .limit(50);

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error("[Channel Logs GET Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { channelId, provider, title, message, severity = "INFO", status, details } = body;

    if (!provider || !title || !message || !status) {
      return NextResponse.json(
        { success: false, error: "Provider, title, message, and status are required." },
        { status: 400 }
      );
    }

    const inserted = await db
      .insert(channelLogs)
      .values({
        channelId: channelId ? Number(channelId) : null,
        provider,
        title,
        message,
        severity,
        status,
        details: typeof details === "object" ? JSON.stringify(details) : details,
      })
      .returning();

    return NextResponse.json({ success: true, data: inserted[0] });
  } catch (error: any) {
    console.error("[Channel Logs POST Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
