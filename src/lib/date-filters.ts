/** Client-side date range checks using local calendar days (YYYY-MM-DD from `<input type="date">`). */

export function timestampInLocalDayRange(
  isoTimestamp: string,
  fromYmd: string,
  toYmd: string,
): boolean {
  if (!fromYmd && !toYmd) return true;
  const t = new Date(isoTimestamp).getTime();
  if (Number.isNaN(t)) return true;

  if (fromYmd) {
    const start = parseYmdLocalStart(fromYmd);
    if (t < start) return false;
  }
  if (toYmd) {
    const end = parseYmdLocalEnd(toYmd);
    if (t > end) return false;
  }
  return true;
}

function parseYmdLocalStart(ymd: string): number {
  const [y, m, d] = ymd.split("-").map((n) => Number.parseInt(n, 10));
  if (!y || !m || !d) return 0;
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

function parseYmdLocalEnd(ymd: string): number {
  const [y, m, d] = ymd.split("-").map((n) => Number.parseInt(n, 10));
  if (!y || !m || !d) return Number.MAX_SAFE_INTEGER;
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}
