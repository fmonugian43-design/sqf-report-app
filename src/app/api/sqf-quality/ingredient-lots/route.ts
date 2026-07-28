import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { reportItems, reports } from "@/db/schema";

type IngredientLot = {
  itemName: string;
  lotCode: string;
};

// Return the most recently recorded lot for each requested ingredient. Lots are
// intentionally sourced from completed SQF quality reports so the last lot used
// stays in place until an operator deliberately records a replacement.
export async function POST(req: Request) {
  const body: { ingredientNames?: unknown } = await req.json();
  const rawIngredientNames: unknown[] = Array.isArray(body.ingredientNames)
    ? body.ingredientNames
    : [];
  const ingredientNames = rawIngredientNames
        .filter((name): name is string => typeof name === "string")
        .map((name) => name.trim())
        .filter(Boolean);

  const uniqueNames = [...new Set(ingredientNames)];
  if (uniqueNames.length === 0) {
    return NextResponse.json([] satisfies IngredientLot[]);
  }

  const rows = await db
    .select({
      itemName: reportItems.productName,
      lotCode: reportItems.lotCode,
    })
    .from(reportItems)
    .innerJoin(reports, eq(reportItems.reportId, reports.id))
    .where(
      and(
        eq(reports.reportType, "sqf-quality"),
        inArray(reportItems.productName, uniqueNames)
      )
    )
    .orderBy(desc(reports.createdAt), desc(reportItems.id));

  const latestLots = new Map<string, IngredientLot>();
  for (const row of rows) {
    const itemName = row.itemName.trim();
    const lotCode = row.lotCode?.trim() || "";
    if (itemName && lotCode && !latestLots.has(itemName)) {
      latestLots.set(itemName, { itemName, lotCode });
    }
  }

  return NextResponse.json([...latestLots.values()]);
}
