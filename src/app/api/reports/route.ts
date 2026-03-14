import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports, reportItems } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { appendViaWebhook } from "@/lib/google-sheets";

export async function GET() {
  const allReports = await db
    .select({
      id: reports.id,
      reportType: reports.reportType,
      companyReceiving: reports.companyReceiving,
      reportDate: reports.reportDate,
      itemCount: sql<number>`(SELECT COUNT(*) FROM report_items WHERE report_id = ${reports.id})`,
    })
    .from(reports)
    .orderBy(desc(reports.createdAt));

  return NextResponse.json(allReports);
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    reportType = "outgoing",
    companyReceiving,
    reportDate,
    receivingMethod = "",
    invoiceNumber = "",
    operatorName = "",
    signature = "",
    items = [],
  } = body;

  if (!companyReceiving || !reportDate) {
    return NextResponse.json(
      { error: "Company and date are required" },
      { status: 400 }
    );
  }

  if (!items.length) {
    return NextResponse.json(
      { error: "At least one product is required" },
      { status: 400 }
    );
  }

  const report = db
    .insert(reports)
    .values({
      reportType,
      companyReceiving,
      reportDate,
      receivingMethod,
      invoiceNumber,
      operatorName,
      signature,
    })
    .returning()
    .get();

  for (const [idx, item] of items.entries()) {
    db.insert(reportItems)
      .values({
        reportId: report.id,
        productName: item.productName,
        lotCode: item.lotCode || "",
        quantity: item.quantity || "",
        condition: item.condition || "",
        sortOrder: idx,
      })
      .run();
  }

  // Sync to Google Sheets (non-blocking)
  appendViaWebhook({
    reportDate,
    companyReceiving,
    receivingMethod,
    invoiceNumber,
    items: items.map((i: { productName: string; lotCode: string; quantity: string; condition: string }) => ({
      productName: i.productName,
      lotCode: i.lotCode || "",
      quantity: i.quantity || "",
      condition: i.condition || "",
    })),
    operatorName,
  }).catch(() => {});

  return NextResponse.json(report, { status: 201 });
}
