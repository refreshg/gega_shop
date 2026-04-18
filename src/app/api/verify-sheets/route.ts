import { NextResponse } from "next/server";

import { getGoogleSpreadsheet, getSpreadsheetId } from "@/lib/googleSheets";

export const runtime = "nodejs";

/**
 * GET /api/verify-sheets — checks that service account env vars load and the spreadsheet opens.
 * Use after `npm run dev`; open http://localhost:3000/api/verify-sheets in the browser.
 */
export async function GET() {
  try {
    const doc = await getGoogleSpreadsheet();
    return NextResponse.json({
      ok: true,
      spreadsheetId: doc.spreadsheetId,
      title: doc.title,
      configuredId: getSpreadsheetId(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: "Ensure .env.local exists next to package.json with GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY filled, then restart the dev server.",
      },
      { status: 500 },
    );
  }
}
