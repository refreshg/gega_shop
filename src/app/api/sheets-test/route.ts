import { NextResponse } from "next/server";

import { testConnection } from "@/lib/db";

/** Node runtime required for `google-auth-library` / JWT. */
export const runtime = "nodejs";

/**
 * GET /api/sheets-test — temporary smoke test for Google Sheets connectivity.
 * After setting .env.local, restart dev server and open this URL in the browser.
 * Uses HTTP 200 with `ok: false` on failure so the response body stays visible in the browser.
 */
export async function GET() {
  try {
    const result = await testConnection();
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false as const, error: message },
      { status: 200 },
    );
  }
}
