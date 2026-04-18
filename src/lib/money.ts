/** All persisted amounts use minor units (e.g. tetri for GEL). */

export function parseMoneyToMinor(input: string): number {
  const cleaned = input.replace(/[^\d.-]/g, "").trim();
  if (!cleaned) return 0;
  const n = Number.parseFloat(cleaned);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

export function formatMinorToDisplay(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function formatMinorAsCurrency(
  minor: number,
  currencyCode = "GEL",
  locale = "ka-GE",
): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currencyCode}`;
  }
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
