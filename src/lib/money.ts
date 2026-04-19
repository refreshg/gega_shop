/** All persisted amounts use minor units (e.g. tetri for GEL). */

export function parseMoneyToMinor(input: string): number {
  const cleaned = input.replace(/[^\d.-]/g, "").trim();
  if (!cleaned) return 0;
  const n = Number.parseFloat(cleaned);
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
 * Major-unit number for Google Sheets cells (avoids string/locale issues).
 * Use with `addRow` / `assign` — library defaults to `USER_ENTERED`.
 */
export function minorToSheetNumber(minor: number): number {
  return Number((minor / 100).toFixed(2));
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
