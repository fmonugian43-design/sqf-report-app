import PDFDocument from "pdfkit";

interface CIPReportData {
  machineName: string;
  operatorName: string;
  reportDate: string;
  lastLotCode: string;
  cleaningProduct: string;
  steps: string[];
  signature: string;
}

export function generateCIPPdf(data: CIPReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 50, compress: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Title
    doc.fontSize(20).font("Helvetica-Bold").text("SAFE FOOD QUALITY REPORT", { align: "center" });
    doc.fontSize(14).text("CLEAN IN PLACE PROCESS", { align: "center" });
    doc.moveDown(1);

    // Info section
    doc.fontSize(11).font("Helvetica-Bold");
    const labelWidth = 220;

    const addField = (label: string, value: string) => {
      doc.font("Helvetica-Bold").text(label, { continued: true, width: labelWidth });
      doc.font("Helvetica").text(value || "N/A");
    };

    addField("MACHINE NAME: ", data.machineName);
    addField("OPERATOR: ", data.operatorName);
    addField("DATE: ", data.reportDate);
    addField("LAST LOT CODE USED ON EQUIPMENT: ", data.lastLotCode);
    addField("PRODUCT USED TO CLEAN: ", data.cleaningProduct);
    doc.moveDown(1);

    // Checklist
    doc.font("Helvetica-Bold").fontSize(12).text("CLEANING PROCEDURES COMPLETED:");
    doc.moveDown(0.5);

    doc.fontSize(11).font("Helvetica");
    data.steps.forEach((step, i) => {
      doc.text(`  ☑  ${i + 1}. ${step}`);
      doc.moveDown(0.3);
    });

    doc.moveDown(1.5);

    // Signature
    doc.font("Helvetica-Bold").text("OPERATOR SIGNATURE: ", { continued: true });
    doc.font("Helvetica").text(data.signature || data.operatorName);

    doc.end();
  });
}
