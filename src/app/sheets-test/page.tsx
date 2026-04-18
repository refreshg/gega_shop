import { testConnection } from "@/lib/db";

/** Always run on request — credentials and sheet data must not be baked into the build. */
export const dynamic = "force-dynamic";

/**
 * Temporary UI to verify Google Sheets (easier to read than raw /api JSON in some browsers).
 * Open: http://localhost:3000/sheets-test
 */
export default async function SheetsTestPage() {
  const result = await testConnection();

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <h1 className="mb-4 text-xl font-semibold">Google Sheets connection test</h1>
      <p className="mb-4 text-sm text-zinc-400">
        Same logic as <code className="rounded bg-zinc-800 px-1">/api/sheets-test</code>. If{" "}
        <code className="rounded bg-zinc-800 px-1">ok</code> is false, check credentials, share
        the spreadsheet with the service account as Editor, enable Google Sheets API, and restart{" "}
        <code className="rounded bg-zinc-800 px-1">npm run dev</code>.
      </p>
      <pre className="overflow-auto rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-sm">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
