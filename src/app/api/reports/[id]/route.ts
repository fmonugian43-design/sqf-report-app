import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports, reportItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reportId = parseInt(id, 10);

  const report = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .get();

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = await db
    .select()
    .from(reportItems)
    .where(eq(reportItems.reportId, reportId))
    .orderBy(reportItems.sortOrder);

  return NextResponse.json({ ...report, items });
}
