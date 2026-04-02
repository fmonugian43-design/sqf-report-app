import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports, reportItems } from "@/db/schema";

const INVENTORY_API_URL =
  process.env.INVENTORY_API_URL ||
  "https://inventory-app-production-e6b0.up.railway.app";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    recipeName,
    recipeType,
    finishedItemId,
    pallets,
    cases,
    lbs,
    reportDate,
    operatorName,
    forceBypass = false,
  } = body;

  if (!recipeName || !reportDate || !operatorName) {
    return NextResponse.json(
      { error: "Recipe, date, and operator are required" },
      { status: 400 }
    );
  }

  // Build quantity display string
  const qtyParts: string[] = [];
  if (lbs) qtyParts.push(`${lbs} lbs`);
  if (pallets) qtyParts.push(`${pallets} pallets`);
  if (cases) qtyParts.push(`${cases} cases`);
  const quantityDisplay = qtyParts.join(", ") || "0";

  // Save local report
  const report = db
    .insert(reports)
    .values({
      reportType: "production",
      companyReceiving: recipeName,
      reportDate,
      receivingMethod: recipeType || "",
      operatorName,
      invoiceNumber: "",
      poNumber: "",
      signature: "",
      machineName: "",
      lastLotCode: "",
      cleaningProduct: "",
      processUsed: "",
    })
    .returning()
    .get();

  db.insert(reportItems)
    .values({
      reportId: report.id,
      productName: recipeName,
      lotCode: "",
      quantity: quantityDisplay,
      condition: recipeType || "",
      sortOrder: 0,
    })
    .run();

  // Call inventory app to execute production
  let inventoryResult: { success?: boolean; error?: string; shortages?: unknown[] } = {};
  try {
    const invRes = await fetch(`${INVENTORY_API_URL}/api/external/production`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipeName,
        finishedItemId,
        productionType: recipeType || "mix",
        pallets: pallets ? Number(pallets) : undefined,
        cases: cases ? Number(cases) : undefined,
        lbs: lbs ? Number(lbs) : undefined,
        forceBypass,
      }),
    });

    inventoryResult = await invRes.json();

    if (!invRes.ok && inventoryResult.shortages) {
      return NextResponse.json(
        {
          report,
          inventoryError: true,
          shortages: inventoryResult.shortages,
          message: inventoryResult.error || "Insufficient stock",
        },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error("Inventory production error:", err);
    return NextResponse.json(
      {
        report,
        inventoryError: true,
        message: "Could not connect to inventory app. Report saved locally.",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    report,
    inventoryResult,
  });
}
