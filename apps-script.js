// Google Apps Script for SQF Report App
// Paste this into Extensions > Apps Script in your Google Sheet
// Then Deploy > New Deployment > Web App > Anyone can access

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  // Add headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Report Date",
      "Company",
      "Method",
      "Invoice #",
      "PO #",
      "Product Name",
      "Lot Code",
      "Quantity",
      "Condition",
      "Operator"
    ]);
  }

  // One row per product item
  var items = data.items || [];
  for (var i = 0; i < items.length; i++) {
    sheet.appendRow([
      data.reportDate,
      data.company,
      data.method,
      data.invoiceNumber,
      data.poNumber || "",
      items[i].productName,
      items[i].lotCode,
      items[i].quantity,
      items[i].condition,
      data.operator
    ]);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}
