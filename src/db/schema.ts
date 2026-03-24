import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reportType: text("report_type").notNull().default("outgoing"),
  companyReceiving: text("company_receiving").notNull(),
  reportDate: text("report_date").notNull(),
  receivingMethod: text("receiving_method").default(""),
  invoiceNumber: text("invoice_number").default(""),
  poNumber: text("po_number").default(""),
  operatorName: text("operator_name").default(""),
  signature: text("signature").default(""),
  // CIP-specific fields
  machineName: text("machine_name").default(""),
  lastLotCode: text("last_lot_code").default(""),
  cleaningProduct: text("cleaning_product").default(""),
  processUsed: text("process_used").default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});

export const reportItems = sqliteTable("report_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reportId: integer("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  lotCode: text("lot_code").default(""),
  quantity: text("quantity").default(""),
  condition: text("condition").default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});
