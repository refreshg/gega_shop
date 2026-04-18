import { randomUUID } from "node:crypto";

import type { GoogleSpreadsheetRow } from "google-spreadsheet";
import { unstable_cache } from "next/cache";

import { getReadySpreadsheet, SHEETS } from "@/lib/db/sheet-config";
import type { ShopUser, ShopUserRole } from "@/types";

function rowToUser(row: GoogleSpreadsheetRow): ShopUser {
  const roleRaw = String(row.get("role") ?? "").trim().toLowerCase();
  const role: ShopUserRole = roleRaw === "admin" ? "admin" : "staff";
  return {
    id: String(row.get("id") ?? "").trim(),
    name: String(row.get("name") ?? "").trim(),
    pin: String(row.get("pin") ?? "").trim(),
    role,
  };
}

export async function listUsers(): Promise<ShopUser[]> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.users];
  const rows = await sheet.getRows();
  return rows.map(rowToUser).filter((u) => u.id);
}

const loadUsersCached = unstable_cache(
  async () => listUsers(),
  ["sheet-list-users"],
  { revalidate: 30, tags: ["sheet-db"] },
);

export async function listUsersCached(): Promise<ShopUser[]> {
  return loadUsersCached();
}

export async function findUserByPin(pin: string): Promise<ShopUser | null> {
  const users = await listUsers();
  const p = pin.trim();
  return users.find((u) => u.pin === p) ?? null;
}

export async function appendUser(data: Omit<ShopUser, "id">): Promise<ShopUser> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.users];
  const id = randomUUID();
  await sheet.addRow({
    id,
    name: data.name,
    pin: data.pin,
    role: data.role,
  });
  return { ...data, id };
}

export async function updateUserRow(
  id: string,
  data: Omit<ShopUser, "id">,
): Promise<void> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.users];
  const rows = await sheet.getRows();
  const row = rows.find((r) => String(r.get("id") ?? "").trim() === id);
  if (!row) throw new Error("User not found");
  row.assign({
    name: data.name,
    pin: data.pin,
    role: data.role,
  });
  await row.save();
}

export async function deleteUserRow(id: string): Promise<void> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.users];
  const rows = await sheet.getRows();
  const row = rows.find((r) => String(r.get("id") ?? "").trim() === id);
  if (!row) throw new Error("User not found");
  await row.delete();
}
