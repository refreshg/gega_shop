/**
 * Thin database-style wrapper around Google Sheets (see `googleSheets.ts` for auth).
 * Existing domain logic also lives under `src/lib/db/*.ts`.
 */

import type { GoogleSpreadsheet } from "google-spreadsheet";

import { SHEETS, ensureWorksheets } from "@/lib/db/sheet-config";
import {
  getGoogleSheetClient,
  getSpreadsheetId,
} from "@/lib/googleSheets";

/** Ensures row data is JSON-serializable (API responses must not throw in NextResponse.json). */
function rowToPlainObject(
  row: { toObject: () => Record<string, unknown> },
): Record<string, string | number | boolean | null> {
  const raw = row.toObject();
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === null || value === undefined) {
      out[key] = null;
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
    } else {
      out[key] = String(value);
    }
  }
  return out;
}

export type TestConnectionResult =
  | {
      ok: true;
      spreadsheetId: string;
      spreadsheetTitle: string;
      /** Tab used for the sample read (not always the leftmost sheet) */
      firstSheetTitle: string | null;
      /** Rows returned by `getRows()` (excluding header) */
      dataRowCount: number;
      /** First few row objects as plain records (for quick verification) */
      sampleRows: Record<string, string | number | boolean | null>[];
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Opens the target spreadsheet, ensures expected tabs + header rows exist (see `sheet-config`),
 * then reads a few rows from the Customers tab to verify end-to-end access.
 */
export async function testConnection(): Promise<TestConnectionResult> {
  try {
    const doc = await getGoogleSheetClient();
    await ensureWorksheets(doc);

    const sheet =
      doc.sheetsByTitle[SHEETS.customers] ?? doc.sheetsByIndex[0];
    if (!sheet) {
      return {
        ok: true,
        spreadsheetId: doc.spreadsheetId,
        spreadsheetTitle: doc.title,
        firstSheetTitle: null,
        dataRowCount: 0,
        sampleRows: [],
      };
    }

    await sheet.loadHeaderRow(1);
    const rows = await sheet.getRows();
    const sampleRows = rows.slice(0, 5).map((row) => rowToPlainObject(row));

    return {
      ok: true,
      spreadsheetId: doc.spreadsheetId,
      spreadsheetTitle: doc.title,
      firstSheetTitle: sheet.title,
      dataRowCount: rows.length,
      sampleRows,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

/**
 * Example read: returns rows from the "Customers" tab if it exists; otherwise the first sheet.
 * Extend this pattern for Products, SalesOrders, etc.
 */
export async function getCustomers(): Promise<{
  sheetTitle: string;
  rows: Record<string, string | number | boolean | null>[];
}> {
  const doc: GoogleSpreadsheet = await getGoogleSheetClient();
  const preferred = doc.sheetsByTitle["Customers"];
  const sheet = preferred ?? doc.sheetsByIndex[0];
  if (!sheet) {
    return { sheetTitle: "", rows: [] };
  }
  await sheet.loadHeaderRow(1);
  const rows = await sheet.getRows();
  return {
    sheetTitle: sheet.title,
    rows: rows.map((r) => rowToPlainObject(r)),
  };
}

export { getGoogleSheetClient, getSpreadsheetId };
