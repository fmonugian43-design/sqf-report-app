import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "sqf.db");

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_type TEXT NOT NULL DEFAULT 'outgoing',
    company_receiving TEXT NOT NULL,
    report_date TEXT NOT NULL,
    receiving_method TEXT DEFAULT '',
    invoice_number TEXT DEFAULT '',
    po_number TEXT DEFAULT '',
    operator_name TEXT DEFAULT '',
    signature TEXT DEFAULT '',
    machine_name TEXT DEFAULT '',
    last_lot_code TEXT DEFAULT '',
    cleaning_product TEXT DEFAULT '',
    process_used TEXT DEFAULT '',
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS report_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    lot_code TEXT DEFAULT '',
    quantity TEXT DEFAULT '',
    condition TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );
`);

// Add CIP columns if they don't exist (safe to run multiple times)
const cols = sqlite.prepare("PRAGMA table_info(reports)").all() as { name: string }[];
const colNames = cols.map((c) => c.name);
if (!colNames.includes("machine_name")) {
  sqlite.exec("ALTER TABLE reports ADD COLUMN machine_name TEXT DEFAULT ''");
}
if (!colNames.includes("last_lot_code")) {
  sqlite.exec("ALTER TABLE reports ADD COLUMN last_lot_code TEXT DEFAULT ''");
}
if (!colNames.includes("cleaning_product")) {
  sqlite.exec("ALTER TABLE reports ADD COLUMN cleaning_product TEXT DEFAULT ''");
}
if (!colNames.includes("process_used")) {
  sqlite.exec("ALTER TABLE reports ADD COLUMN process_used TEXT DEFAULT ''");
}

export const db = drizzle(sqlite, { schema });
