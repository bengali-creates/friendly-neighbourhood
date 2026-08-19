import { NextResponse } from "next/server";
import { db } from "@/db";
import { civicNotices } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, scheme_name, category, summary, source_url, effective_date } = body;

    const notice = await db.insert(civicNotices).values({
      title,
      schemeName: scheme_name,
      category,
      summary,
      sourceUrl: source_url,
      effectiveDate: effective_date ? new Date(effective_date) : null,
    }).returning();

    return NextResponse.json({ success: true, data: notice[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const notices = await db.select().from(civicNotices).orderBy(civicNotices.createdAt);
    return NextResponse.json({ success: true, data: notices });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
