import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports, reportItems } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { appendViaWebhook } from "@/lib/google-sheets";
import { generateCIPPdf } from "@/lib/pdf";
import { sendCIPReport } from "@/lib/email";

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
    companyReceiving = "",
    reportDate,
    receivingMethod = "",
    invoiceNumber = "",
    poNumber = "",
    operatorName = "",
    signature = "",
    machineName = "",
    lastLotCode = "",
    cleaningProduct = "",
    processUsed = "",
    items = [],
  } = body;

  if (!reportDate) {
    return NextResponse.json(
      { error: "Date is required" },
      { status: 400 }
    );
  }

  // CIP reports don't require company or items
  if (reportType !== "cip" && !companyReceiving) {
    return NextResponse.json(
      { error: "Company is required" },
      { status: 400 }
    );
  }

  if (reportType !== "cip" && !items.length) {
    return NextResponse.json(
      { error: "At least one product is required" },
      { status: 400 }
    );
  }

  const report = db
    .insert(reports)
    .values({
      reportType,
      companyReceiving: companyReceiving || reportType === "cip" ? (machineName || "CIP Report") : companyReceiving,
      reportDate,
      receivingMethod,
      invoiceNumber,
      poNumber,
      operatorName,
      signature,
      machineName,
      lastLotCode,
      cleaningProduct,
      processUsed,
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

  // Sync to Google Sheets (non-blocking) - only for incoming/outgoing
  if (reportType !== "cip") {
    appendViaWebhook({
      reportDate,
      companyReceiving,
      receivingMethod,
      invoiceNumber,
      poNumber,
      items: items.map((i: { productName: string; lotCode: string; quantity: string; condition: string }) => ({
        productName: i.productName,
        lotCode: i.lotCode || "",
        quantity: i.quantity || "",
        condition: i.condition || "",
      })),
      operatorName,
    }).catch(() => {});
  }

  // Generate PDF and email for CIP reports (non-blocking)
  if (reportType === "cip") {
    const steps = processUsed
      .split("\n")
      .map((line: string) => line.replace(/^\d+\.\s*/, "").replace(/\s*✓$/, ""))
      .filter((s: string) => s.trim());

    generateCIPPdf({
      machineName,
      operatorName,
      reportDate,
      lastLotCode,
      cleaningProduct,
      steps,
      signature,
    })
      .then((pdfBuffer) => {
        const dateStr = reportDate.replace(/-/g, "");
        const machineSlug = machineName.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-");
        const filename = `CIP-${machineSlug}-${dateStr}.pdf`;
        return sendCIPReport(
          process.env.CIP_EMAIL_TO || "Fmonugian@newcastlebeverage.com",
          `CIP Report: ${machineName} - ${reportDate}`,
          pdfBuffer,
          filename
        );
      })
      .catch((err) => console.error("CIP email error:", err));
  }

  return NextResponse.json(report, { status: 201 });
}
