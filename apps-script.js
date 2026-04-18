// Google Apps Script for SQF Report App
// Paste this into Extensions > Apps Script in your Google Sheet
// Then Deploy > New Deployment > Web App > Anyone can access

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);

  // Route to SQF Quality tab if sheetName is specified
  if (data.sheetName === "SQF Quality") {
    return handleSQFQuality(ss, data);
  }

  // Route incoming reports to their own tab
  if (data.sheetName === "Incoming") {
    return handleIncoming(ss, data);
  }

  // Default: Outgoing report (original behavior)
  var sheet = ss.getActiveSheet();

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

function handleIncoming(ss, data) {
  var sheet = ss.getSheetByName("Incoming");
  if (!sheet) {
    sheet = ss.insertSheet("Incoming");
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

function handleSQFQuality(ss, data) {
  // Get or create the "SQF Quality" tab
  var sheet = ss.getSheetByName("SQF Quality");
  if (!sheet) {
    sheet = ss.insertSheet("SQF Quality");
    sheet.appendRow([
      "Production Date",
      "Product",
      "Lot Code",
      "Hot Fill",
      "Expiration Date",
      "Ingredient",
      "Ingredient Lot Code",
      "Operator"
    ]);
  }

  // One row per ingredient
  var ingredients = data.ingredients || [];
  for (var i = 0; i < ingredients.length; i++) {
    sheet.appendRow([
      data.productionDate,
      data.productName,
      data.productLotCode,
      data.hotFill,
      data.expirationDate,
      ingredients[i].ingredientName,
      ingredients[i].lotCode,
      data.operator
    ]);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}
