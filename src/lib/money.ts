/** All persisted amounts use minor units (e.g. tetri for GEL). */

export function parseMoneyToMinor(input: string): number {
  let t = String(input).trim();
  if (!t) return 0;
  // "230,50" / "1 230,50" style → decimal comma
  const compact = t.replace(/\s/g, "");
  if (/^\d+[,.]\d{1,2}$/.test(compact)) {
    t = compact.replace(",", ".");
  } else {
    t = t.replace(/[^\d.-]/g, "");
  }
  const n = Number.parseFloat(t);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

/**
 * Plain major-unit string with exactly two decimals (e.g. "2300.00").
 * Empty input stays empty (for optional fields).
 */
export function formatCurrency(value: number | string): string {
  if (value === "" || value === null || value === undefined) return "";
  const n =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value).replace(/[^\d.-]/g, ""));
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

export function formatCurrencyFromMinor(minor: number): string {
  return formatCurrency(minor / 100);
}

/** Legacy name — same as {@link formatCurrencyFromMinor}. */
export function formatMinorToDisplay(minor: number): string {
  return formatCurrencyFromMinor(minor);
}

/**
 * Major-unit value for Google Sheets money cells.
 * Always use a decimal string (e.g. `"230.00"`) with `USER_ENTERED` so the sheet
 * keeps two decimals and reads back as major GEL, not legacy tetri integers.
 */
export function minorToSheetValue(minor: number): string {
  return formatCurrencyFromMinor(minor);
}

/** @deprecated Prefer {@link minorToSheetValue} for clarity. */
export function minorToSheetNumber(minor: number): string {
  return minorToSheetValue(minor);
}

export function formatMinorAsCurrency(
  minor: number,
  currencyCode = "GEL",
): string {
  return `${currencyCode} ${formatCurrencyFromMinor(minor)}`;
}

export function lineTotalMinor(
  quantity: number,
  unitPriceMinor: number,
): number {
  return quantity * unitPriceMinor;
}

export function sumPaymentsMinor(
  payments: { amountPaidMinor: number }[],
): number {
  return payments.reduce((s, p) => s + p.amountPaidMinor, 0);
}

export function remainingDebtMinor(
  totalAmountMinor: number,
  payments: { amountPaidMinor: number }[],
): number {
  return Math.max(0, totalAmountMinor - sumPaymentsMinor(payments));
}
