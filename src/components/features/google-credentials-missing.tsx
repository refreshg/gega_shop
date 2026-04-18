import Link from "next/link";

/**
 * Shown when `.env.local` has no Google credentials yet (prevents a red 500 on every route).
 */
export function GoogleCredentialsMissing() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Google Sheets credentials needed
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Your <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.local</code>{" "}
          file exists next to{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">package.json</code>,
          but <strong>no credentials are set yet</strong> (all Google variables are still
          empty).
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40">
        <p className="font-medium text-amber-900 dark:text-amber-100">
          Do one of the following, then save the file and restart{" "}
          <code className="rounded bg-white/80 px-1 dark:bg-black/40">npm run dev</code>
          :
        </p>
        <ul className="mt-3 list-inside list-disc space-y-2 text-amber-900/90 dark:text-amber-100/90">
          <li>
            <strong>Option A (easiest on Windows):</strong> Download your service account
            JSON from Google Cloud, save it somewhere (e.g.{" "}
            <code className="rounded bg-white/80 px-1 dark:bg-black/40">
              C:\secrets\my-key.json
            </code>
            ), then set in{" "}
            <code className="rounded bg-white/80 px-1 dark:bg-black/40">.env.local</code>:
            <pre className="mt-2 overflow-x-auto rounded bg-white/90 p-3 text-xs text-zinc-900 dark:bg-black/50 dark:text-zinc-100">
              {`GOOGLE_APPLICATION_CREDENTIALS=C:/secrets/my-key.json`}
            </pre>
          </li>
          <li>
            <strong>Option B:</strong> Set{" "}
            <code className="rounded bg-white/80 px-1 dark:bg-black/40">
              GOOGLE_SERVICE_ACCOUNT_EMAIL
            </code>{" "}
            and{" "}
            <code className="rounded bg-white/80 px-1 dark:bg-black/40">
              GOOGLE_PRIVATE_KEY
            </code>{" "}
            (from the same JSON: <code>client_email</code> and <code>private_key</code>).
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="font-medium">Verify in the terminal (from the silver-shop folder)</p>
        <pre className="mt-2 overflow-x-auto rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
          npm run env:check
        </pre>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          You should see <code>Result: OK</code> after credentials are detected.
        </p>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Also share your spreadsheet with the service account email (Editor). Then try{" "}
        <Link className="underline" href="/api/verify-sheets">
          /api/verify-sheets
        </Link>
        .
      </p>
    </div>
  );
}
