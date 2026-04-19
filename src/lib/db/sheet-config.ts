import { randomUUID } from "node:crypto";

import type {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";

import { getGoogleSpreadsheet } from "@/lib/googleSheets";

/** Worksheet titles inside the spreadsheet. */
export const SHEETS = {
  users: "Users",
  customers: "Customers",
  products: "Products",
  salesOrders: "SalesOrders",
  orderItems: "OrderItems",
  payments: "Payments",
} as const;

/**
 * Header row for each tab. Extra columns (e.g. isConsignment, description, method)
 * support the existing UI and payment logic while staying compatible with the brief.
 */
export const HEADERS: Record<string, readonly string[]> = {
  [SHEETS.users]: ["id", "name", "pin", "role"],
  [SHEETS.customers]: [
    "id",
    "firstName",
    "lastName",
    "phone",
    "personalId",
    "createdAt",
    "createdBy",
  ],
  [SHEETS.products]: [
    "id",
    "name",
    "description",
    "price",
    "stock",
    "createdBy",
  ],
  [SHEETS.salesOrders]: [
    "id",
    "customerId",
    "totalAmount",
    "status",
    "paymentTerms",
    "createdAt",
    "isConsignment",
    "createdBy",
  ],
  [SHEETS.orderItems]: [
    "id",
    "orderId",
    "productId",
    "quantity",
    "unitPrice",
    "description",
  ],
  [SHEETS.payments]: [
    "id",
    "orderId",
    "amountPaid",
    "paymentDate",
    "method",
    "processedBy",
  ],
};

let ensured = false;

/** First-time login: written to the Users sheet when it has no accounts yet. */
const DEFAULT_ADMIN_USER = {
  name: "Admin",
  pin: "3377",
  role: "admin",
} as const;

async function seedDefaultAdminUser(doc: GoogleSpreadsheet): Promise<void> {
  const sheet = doc.sheetsByTitle[SHEETS.users];
  if (!sheet) return;
  const rows = await sheet.getRows();
  const hasAnyUser = rows.some(
    (r) => String(r.get("id") ?? "").trim() !== "",
  );
  if (hasAnyUser) return;
  await sheet.addRow({
    id: randomUUID(),
    name: DEFAULT_ADMIN_USER.name,
    pin: DEFAULT_ADMIN_USER.pin,
    role: DEFAULT_ADMIN_USER.role,
  });
}

/** Appends missing header cells so existing spreadsheets gain new columns safely. */
export async function extendWorksheetHeaders(
  sheet: GoogleSpreadsheetWorksheet,
  desired: readonly string[],
): Promise<void> {
  await sheet.loadHeaderRow(1);
  const current = [...sheet.headerValues];
  const missing = desired.filter((h) => !current.includes(h));
  if (missing.length === 0) return;

  const merged = [...current, ...missing];

  if (merged.length > sheet.columnCount) {
    await sheet.resize({
      columnCount: merged.length,
      rowCount: Math.max(sheet.rowCount, 100),
    });
  }

  await sheet.setHeaderRow(merged);
}

/** Creates missing worksheets with the expected header row. Safe to call once at startup. */
export async function ensureWorksheets(doc: GoogleSpreadsheet): Promise<void> {
  if (ensured) return;
  await doc.loadInfo();
  for (const [title, headerValues] of Object.entries(HEADERS)) {
    if (!doc.sheetsByTitle[title]) {
      await doc.addSheet({ title, headerValues: [...headerValues] });
    }
  }
  await doc.loadInfo();
  for (const title of Object.keys(HEADERS)) {
    const sheet = doc.sheetsByTitle[title];
    if (sheet) await sheet.loadHeaderRow(1);
  }
  for (const [title, headerValues] of Object.entries(HEADERS)) {
    const sheet = doc.sheetsByTitle[title];
    if (sheet) {
      await extendWorksheetHeaders(sheet, headerValues);
    }
  }
  await doc.loadInfo();
  for (const title of Object.keys(HEADERS)) {
    const sheet = doc.sheetsByTitle[title];
    if (sheet) await sheet.loadHeaderRow(1);
  }
  await seedDefaultAdminUser(doc);
  await doc.loadInfo();
  ensured = true;
}

export async function getReadySpreadsheet(): Promise<GoogleSpreadsheet> {
  const doc = await getGoogleSpreadsheet();
  await ensureWorksheets(doc);
  return doc;
}
