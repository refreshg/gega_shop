import type { SalesOrderStatus } from "@/types";
import { parseMoneyToMinor } from "@/lib/money";

export function parseIntSafe(v: string | number | undefined | null): number {
  if (v === undefined || v === null || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : 0;
  const n = Number.parseInt(String(v).replace(/,/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Money stored in sheets may be either:
 * - minor units (legacy): 255600
 * - major units (preferred for readability): 2556.00
 */
export function parseMoneyCellToMinor(
  v: string | number | undefined | null,
): number {
  if (v === undefined || v === null || v === "") return 0;
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return 0;
    // Heuristic: small integers are likely major units (e.g. 2556),
    // large integers are likely legacy minor units.
    if (Number.isInteger(v) && Math.abs(v) >= 100000) return v;
    return Math.round(v * 100);
  }
  const s = String(v).trim();
  if (!s) return 0;
  // If it has a decimal separator, treat as major currency.
  if (/[.,]\d{1,2}\s*$/.test(s)) {
    return parseMoneyToMinor(s);
  }
  // Digits-only strings are treated as legacy minor units.
  if (/^\d+$/.test(s.replace(/,/g, ""))) {
    return parseIntSafe(s);
  }
  // Fallback: parse as major.
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
