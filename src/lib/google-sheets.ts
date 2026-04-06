interface ReportSheetRow {
  reportDate: string;
  companyReceiving: string;
  receivingMethod: string;
  invoiceNumber: string;
  poNumber: string;
  items: Array<{
    productName: string;
    lotCode: string;
    quantity: string;
    condition: string;
  }>;
  operatorName: string;
}

export async function appendViaWebhook(row: ReportSheetRow & { reportType?: string }) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(row.reportType === "incoming" ? { sheetName: "Incoming" } : {}),
        reportDate: row.reportDate,
        company: row.companyReceiving,
        method: row.receivingMethod,
        invoiceNumber: row.invoiceNumber,
        poNumber: row.poNumber,
        items: row.items.map((i) => ({
          productName: i.productName,
          lotCode: i.lotCode,
          quantity: i.quantity,
          condition: i.condition,
        })),
        operator: row.operatorName,
      }),
    });
  } catch (err) {
    console.error("Google Sheets webhook error:", err);
  }
}

interface SQFQualitySheetRow {
  productName: string;
  productLotCode: string;
  hotFill: string;
  productionDate: string;
  expirationDate: string;
  operatorName: string;
  ingredients: Array<{ ingredientName: string; lotCode: string }>;
}

export async function appendSQFQualityViaWebhook(row: SQFQualitySheetRow) {
  const webhookUrl = process.env.GOOGLE_SHEET_SQF_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sheetName: "SQF Quality",
        productName: row.productName,
        productLotCode: row.productLotCode,
        hotFill: row.hotFill,
        productionDate: row.productionDate,
        expirationDate: row.expirationDate,
        operator: row.operatorName,
        ingredients: row.ingredients,
      }),
    });
  } catch (err) {
    console.error("SQF Quality webhook error:", err);
  }
}
