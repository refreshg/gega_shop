import type { GoogleSpreadsheetRow } from "google-spreadsheet";
import { unstable_cache } from "next/cache";

import { getReadySpreadsheet, SHEETS } from "@/lib/db/sheet-config";
import { parseIntSafe, parseMoneyCellToMinor } from "@/lib/db/parse";
import { minorToSheetNumber } from "@/lib/money";
import type { Product } from "@/types";

function rowToProduct(row: GoogleSpreadsheetRow): Product {
  const priceRaw = row.get("price");
  const priceMinor =
    priceRaw === "" || priceRaw === undefined || priceRaw === null
      ? null
      : parseMoneyCellToMinor(priceRaw);
  const stockRaw = row.get("stock");
  const stock =
    stockRaw === "" || stockRaw === undefined || stockRaw === null
      ? 0
      : parseIntSafe(stockRaw);

  return {
    id: String(row.get("id") ?? "").trim(),
    name: String(row.get("name") ?? "").trim(),
    description: (() => {
      const d = row.get("description");
      if (d === undefined || d === null || d === "") return null;
      return String(d);
    })(),
    priceMinor,
    stock,
    createdBy: String(row.get("createdBy") ?? "").trim(),
  };
}

export async function listProducts(): Promise<Product[]> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.products];
  const rows = await sheet.getRows();
  return rows
    .map(rowToProduct)
    .filter((p) => p.id)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const listProductsCached = unstable_cache(
  async () => listProducts(),
  ["sheet-list-products"],
  { revalidate: 60, tags: ["sheet-db"] },
);

export async function appendProduct(
  data: Omit<Product, "id">,
): Promise<Product> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.products];
  const id = crypto.randomUUID();
  await sheet.addRow({
    id,
    name: data.name,
    description: data.description ?? "",
    price:
      data.priceMinor === null || data.priceMinor === undefined
        ? ""
        : minorToSheetNumber(data.priceMinor),
    stock: String(data.stock ?? 0),
    createdBy: data.createdBy,
  });
  return { ...data, id };
}

export async function deleteProductRow(id: string): Promise<void> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.products];
  const rows = await sheet.getRows();
  const row = rows.find((r) => String(r.get("id") ?? "").trim() === id);
  if (!row) throw new Error("Product not found");
  await row.delete();
}
