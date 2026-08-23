import { NextResponse } from "next/server";
import { db } from "@/db";
import { activeJobs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const collectorId = searchParams.get("collectorId");

    if (jobId) {
      const job = await db.select().from(activeJobs).where(eq(activeJobs.jobId, jobId)).limit(1);
      if (job.length > 0) {
        return NextResponse.json({ success: true, found: true, data: job[0] });
      }
      return NextResponse.json({ success: true, found: false, data: null });
    }

    if (collectorId) {
      const job = await db.select().from(activeJobs).where(eq(activeJobs.collectorId, collectorId)).orderBy(desc(activeJobs.updatedAt)).limit(1);
      if (job.length > 0) {
        return NextResponse.json({ success: true, found: true, data: job[0] });
      }
      return NextResponse.json({ success: true, found: false, data: null });
    }

    const allJobs = await db.select().from(activeJobs).orderBy(desc(activeJobs.updatedAt)).limit(20);
    return NextResponse.json({ success: true, data: allJobs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, collectorId, url, status, progress, currentStep, bytesScraped, itemsScraped } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: "jobId is required" }, { status: 400 });
    }

    const existing = await db.select().from(activeJobs).where(eq(activeJobs.jobId, jobId)).limit(1);

    let result;
    if (existing.length > 0) {
      result = await db
        .update(activeJobs)
        .set({
          collectorId: collectorId ?? existing[0].collectorId,
          url: url ?? existing[0].url,
          status: status ?? existing[0].status,
          progress: progress ?? existing[0].progress,
          currentStep: currentStep ?? existing[0].currentStep,
          bytesScraped: bytesScraped ?? existing[0].bytesScraped,
          itemsScraped: itemsScraped ?? existing[0].itemsScraped,
          updatedAt: new Date(),
        })
        .where(eq(activeJobs.jobId, jobId))
        .returning();
    } else {
      result = await db
        .insert(activeJobs)
        .values({
          jobId,
          collectorId: collectorId ?? null,
          url: url ?? null,
          status: status || "initializing",
          progress: progress ?? 0,
          currentStep: currentStep || "Initializing scraper task",
          bytesScraped: bytesScraped ?? 0,
          itemsScraped: itemsScraped ?? 0,
        })
        .returning();
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ success: false, error: "jobId is required" }, { status: 400 });
    }

    await db.delete(activeJobs).where(eq(activeJobs.jobId, jobId));
    return NextResponse.json({ success: true, message: "Job record deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

