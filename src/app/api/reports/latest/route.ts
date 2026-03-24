import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports, reportItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const report = await db
    .select()
    .from(reports)
    .where(eq(reports.reportType, "outgoing"))
    .orderBy(desc(reports.createdAt))
    .limit(1)
    .get();

  if (!report) {
    return NextResponse.json({ error: "No reports found" }, { status: 404 });
  }

  const items = await db
    .select()
    .from(reportItems)
    .where(eq(reportItems.reportId, report.id))
    .orderBy(reportItems.sortOrder);

  return NextResponse.json({ ...report, items });
}
