import { NextResponse } from "next/server";
import { db } from "@/db";
import { collectors, snapshots, alerts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

type Params = { params: Promise<{ collectorId: string }> };

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { collectorId } = await params;

    // 1. Fetch Collector details
    const collRows = await db
      .select()
      .from(collectors)
      .where(eq(collectors.collectorId, collectorId))
      .limit(1);

    if (collRows.length === 0) {
      return new NextResponse("Collector not found", { status: 404 });
    }

    const collector = collRows[0];
    const feedTitle = escapeXml(`${collector.name} - Change Radar Feed`);
    const feedLink = escapeXml(collector.url);
    const feedDesc = escapeXml(
      `Autonomous Spider-Sense Radar feed monitoring policy mutations, terms changes, and updates for ${collector.name}`
    );

    // 2. Fetch associated Alerts & Snapshots
    const alertRows = await db
      .select()
      .from(alerts)
      .where(eq(alerts.collectorId, collectorId))
      .orderBy(desc(alerts.createdAt))
      .limit(20);

    const snapshotRows = await db
      .select()
      .from(snapshots)
      .where(eq(snapshots.collectorId, collectorId))
      .orderBy(desc(snapshots.scrapedAt))
      .limit(10);

    // 3. Assemble RSS Items
    const itemsXml = alertRows.map((a) => {
      const itemTitle = escapeXml(`[${a.severity}] Policy Mutation Alert: ${a.message.slice(0, 80)}...`);
      const itemDesc = escapeXml(
        `${a.message}\n\nPosition A: ${a.positionA || "N/A"}\n\nPosition B: ${a.positionB || "N/A"}\n\nAction Script:\n${a.draftScript || "None"}`
      );
      const pubDate = new Date(a.createdAt).toUTCString();
      const guid = `alert-${a.id}`;

      return `    <item>
      <title>${itemTitle}</title>
      <link>${feedLink}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${itemDesc}]]></description>
    </item>`;
    }).join("\n");

    const snapshotItemsXml = snapshotRows.map((s) => {
      const itemTitle = escapeXml(`Snapshot Verified: ${collector.name}`);
      const previewText = s.text ? s.text.slice(0, 250) : "Snapshot baseline recorded.";
      const pubDate = new Date(s.scrapedAt).toUTCString();
      const guid = `snapshot-${s.id}`;

      return `    <item>
      <title>${itemTitle}</title>
      <link>${feedLink}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${escapeXml(previewText)}...]]></description>
    </item>`;
    }).join("\n");

    const allItemsXml = [itemsXml, snapshotItemsXml].filter(Boolean).join("\n");
    const lastBuildDate = new Date().toUTCString();

    // 4. Construct valid RSS 2.0 XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${feedTitle}</title>
    <link>${feedLink}</link>
    <description>${feedDesc}</description>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>Spider-Sense In-House Scraper &amp; Radar Engine</generator>
${allItemsXml}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error: any) {
    return new NextResponse(`<error>${escapeXml(error.message)}</error>`, {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    });
  }
}
