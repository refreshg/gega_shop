import type { SalesOrderStatus } from "@/types";
import { parseMoneyToMinor } from "@/lib/money";

export function parseIntSafe(v: string | number | undefined | null): number {
  if (v === undefined || v === null || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : 0;
  const n = Number.parseInt(String(v).replace(/,/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Converts a sheet cell to **minor units** (tetri) for internal math.
 *
 * - Values **with** a decimal separator are **major GEL** (e.g. `230.00` → 23000 tetri).
 * - Plain integers **>= 10000** are treated as **legacy tetri** (no decimal in old rows).
 * - Plain integers **< 10000** are treated as **major GEL** (e.g. `230` → 230.00 GEL).
 */
export function parseMoneyCellToMinor(
  v: string | number | undefined | null,
): number {
  if (v === undefined || v === null || v === "") return 0;

  if (typeof v === "number") {
    if (!Number.isFinite(v)) return 0;
    if (!Number.isInteger(v)) {
      return Math.round(v * 100);
    }
    const n = v;
    if (Math.abs(n) >= 100000) return n;
    if (Math.abs(n) >= 10000) return n;
    return Math.round(n * 100);
  }

  const s = String(v).trim();
  if (!s) return 0;

  // Explicit decimal → major units (comma or dot)
  if (/[.,]\d/.test(s)) {
    const normalized = s.replace(/\s/g, "").replace(",", ".");
    return parseMoneyToMinor(normalized);
  }

  const digitsOnly = s.replace(/[,\s]/g, "");
  if (/^\d+$/.test(digitsOnly)) {
    const n = Number.parseInt(digitsOnly, 10);
    if (Number.isNaN(n)) return 0;
    if (n >= 100000) return n;
    if (n >= 10000) return n;
    return parseMoneyToMinor(digitsOnly);
  }

  return parseMoneyToMinor(s);
}

export function parseBool(v: string | boolean | undefined | null): boolean {
  if (typeof v === "boolean") return v;
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

export function parseDate(v: string | undefined | null): Date {
  if (!v) return new Date();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/**
 * `unstable_cache` serializes results as JSON, so `Date` fields become strings.
 * Use this when reading cached rows so `.getTime()` and `instanceof Date` work.
 */
export function coerceDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

const STATUS: SalesOrderStatus[] = [
  "PAID",
  "PARTIALLY_PAID",
  "CONSIGNMENT",
  "UNPAID",
];

export function parseOrderStatus(
  v: string | undefined | null,
): SalesOrderStatus {
  const s = String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (STATUS.includes(s as SalesOrderStatus)) return s as SalesOrderStatus;
  return "UNPAID";
}
