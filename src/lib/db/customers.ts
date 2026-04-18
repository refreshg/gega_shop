import type { GoogleSpreadsheetRow } from "google-spreadsheet";
import { unstable_cache } from "next/cache";

import { getReadySpreadsheet, SHEETS } from "@/lib/db/sheet-config";
import { coerceDate, parseDate } from "@/lib/db/parse";
import type { Customer } from "@/types";

function rowToCustomer(row: GoogleSpreadsheetRow): Customer {
  return {
    id: String(row.get("id") ?? "").trim(),
    firstName: String(row.get("firstName") ?? "").trim(),
    lastName: String(row.get("lastName") ?? "").trim(),
    phone: String(row.get("phone") ?? "").trim(),
    personalId: String(row.get("personalId") ?? "").trim(),
    createdAt: parseDate(String(row.get("createdAt") ?? "")),
    createdBy: String(row.get("createdBy") ?? "").trim(),
  };
}

export async function listCustomers(): Promise<Customer[]> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.customers];
  const rows = await sheet.getRows();
  return rows
    .map(rowToCustomer)
    .filter((c) => c.id)
    .sort((a, b) => a.lastName.localeCompare(b.lastName));
}

const loadCustomersCached = unstable_cache(
  async () => listCustomers(),
  ["sheet-list-customers"],
  { revalidate: 45, tags: ["sheet-db"] },
);

/** Cached read; revives `createdAt` after JSON round-trip from `unstable_cache`. */
export async function listCustomersCached(): Promise<Customer[]> {
  const rows = await loadCustomersCached();
  return rows.map((c) => ({
    ...c,
    createdAt: coerceDate(c.createdAt),
  }));
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customers = await listCustomers();
  return customers.find((c) => c.id === id) ?? null;
}

export async function findCustomerByPersonalId(
  personalId: string,
): Promise<Customer | null> {
  const pid = personalId.trim().toLowerCase();
  const customers = await listCustomers();
  return (
    customers.find((c) => c.personalId.toLowerCase() === pid) ?? null
  );
}

export async function appendCustomer(
  data: Omit<Customer, "id" | "createdAt">,
): Promise<Customer> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.customers];
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await sheet.addRow({
    id,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    personalId: data.personalId,
    createdAt,
    createdBy: data.createdBy,
  });
  return {
    id,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    personalId: data.personalId,
    createdAt: new Date(createdAt),
    createdBy: data.createdBy,
  };
}

export async function updateCustomerRow(
  id: string,
  data: Omit<Customer, "id" | "createdAt" | "createdBy">,
): Promise<void> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.customers];
  const rows = await sheet.getRows();
  const row = rows.find((r) => String(r.get("id") ?? "").trim() === id);
  if (!row) throw new Error("Customer not found");
  row.assign({
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    personalId: data.personalId,
  });
  await row.save();
}

export async function deleteCustomerRow(id: string): Promise<void> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.customers];
  const rows = await sheet.getRows();
  const row = rows.find((r) => String(r.get("id") ?? "").trim() === id);
  if (!row) throw new Error("Customer not found");
  await row.delete();
}
