import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface CIPReportData {
  machineName: string;
  operatorName: string;
  reportDate: string;
  lastLotCode: string;
  cleaningProduct: string;
  steps: string[];
  signature: string;
}

export async function generateCIPPdf(data: CIPReportData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // Letter size
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  let y = 740;
  const left = 50;

  // Title
  page.drawText("SAFE FOOD QUALITY REPORT", {
    x: 150,
    y,
    size: 18,
    font: bold,
    color: rgb(0, 0, 0),
  });
  y -= 25;
  page.drawText("CLEAN IN PLACE PROCESS", {
    x: 190,
    y,
    size: 13,
    font: bold,
    color: rgb(0, 0, 0),
  });
  y -= 40;

  // Fields
  const addField = (label: string, value: string) => {
    page.drawText(label, { x: left, y, size: 11, font: bold });
    page.drawText(value || "N/A", { x: left + 250, y, size: 11, font: regular });
    y -= 22;
  };

  addField("MACHINE NAME:", data.machineName);
  addField("OPERATOR:", data.operatorName);
  addField("DATE:", data.reportDate);
  addField("LAST LOT CODE:", data.lastLotCode);
  addField("PRODUCT USED TO CLEAN:", data.cleaningProduct);

  y -= 15;

  // Checklist header
  page.drawText("CLEANING PROCEDURES COMPLETED:", {
    x: left,
    y,
    size: 12,
    font: bold,
  });
  y -= 25;

  // Steps
  data.steps.forEach((step, i) => {
    page.drawText(`[X]  ${i + 1}. ${step}`, {
      x: left + 10,
      y,
      size: 11,
      font: regular,
    });
    y -= 20;
  });

  y -= 25;

  // Signature
  page.drawText("OPERATOR SIGNATURE:", { x: left, y, size: 11, font: bold });
  page.drawText(data.signature || data.operatorName, {
    x: left + 160,
    y,
    size: 11,
    font: regular,
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
