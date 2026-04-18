import type { SalesOrderStatus } from "@/types";

export function parseIntSafe(v: string | number | undefined | null): number {
  if (v === undefined || v === null || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : 0;
  const n = Number.parseInt(String(v).replace(/,/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
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
