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

export async function appendViaWebhook(row: ReportSheetRow) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
