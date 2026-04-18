/** Worksheet titles inside the spreadsheet. */
export const SHEETS = {
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
  [SHEETS.customers]: [
    "id",
    "firstName",
    "lastName",
    "phone",
    "personalId",
    "createdAt",
  ],
  [SHEETS.products]: ["id", "name", "description", "price"],
  [SHEETS.salesOrders]: [
    "id",
    "customerId",
    "totalAmount",
    "status",
    "paymentTerms",
    "createdAt",
    "isConsignment",
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
  ],
};

import type { GoogleSpreadsheet } from "google-spreadsheet";

import { getGoogleSpreadsheet } from "@/lib/googleSheets";

let ensured = false;

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
  ensured = true;
}

export async function getReadySpreadsheet(): Promise<GoogleSpreadsheet> {
  const doc = await getGoogleSpreadsheet();
  await ensureWorksheets(doc);
  return doc;
}
