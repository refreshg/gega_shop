import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

/** Default spreadsheet from the product brief; override with GOOGLE_SPREADSHEET_ID. */
export const DEFAULT_SPREADSHEET_ID =
  "1GJfsxuNDu5haL0ByECNalB4dDy0o44WjZvMWXkFNb1U";

const envHint =
  " In the project root (same folder as package.json), edit .env.local: either set GOOGLE_APPLICATION_CREDENTIALS to the path of your downloaded JSON key file, OR set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY. Save the file, stop the dev server (Ctrl+C), then run npm run dev again.";

export type GoogleCredentials = { email: string; privateKey: string };

/**
 * True if credentials are present and usable:
 * - JSON path: file exists on disk (same resolution as getCredentials)
 * - Or both inline email + private key are non-empty
 *
 * Next.js may still run `page.tsx` even when the layout shows a setup screen,
 * so pages must guard before calling any Sheet-backed data loaders.
 */
export function hasGoogleCredentialsConfigured(): boolean {
  const credPathRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credPathRaw) {
    const credPath = credPathRaw.replace(/^["']|["']$/g, "");
    const tryPaths = [credPath, resolve(process.cwd(), credPath)];
    return tryPaths.some((p) => existsSync(p));
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GOOGLE_PRIVATE_KEY?.trim();
  return Boolean(email && key);
}

/**
 * Loads credentials from (priority):
 * 1. GOOGLE_APPLICATION_CREDENTIALS — absolute or relative path to the service account JSON file (recommended on Windows)
 * 2. GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY — inline in .env.local
 */
export async function getCredentials(): Promise<GoogleCredentials> {
  const credPathRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credPathRaw) {
    const credPath = credPathRaw.replace(/^["']|["']$/g, "");
    const { readFile } = await import("node:fs/promises");
    const tryPaths = [credPath, resolve(process.cwd(), credPath)];
    let jsonText: string | null = null;
    let usedPath = "";
    for (const p of tryPaths) {
      try {
        jsonText = await readFile(p, "utf8");
        usedPath = p;
        break;
      } catch {
        /* try next */
      }
    }
    if (!jsonText) {
      throw new Error(
        `Could not read GOOGLE_APPLICATION_CREDENTIALS file. Tried: ${tryPaths.join(", ")}.${envHint}`,
      );
    }
    try {
      const json = JSON.parse(jsonText) as {
        client_email?: string;
        private_key?: string;
      };
      if (!json.client_email || !json.private_key) {
        throw new Error("JSON must contain client_email and private_key");
      }
      return { email: json.client_email, privateKey: json.private_key };
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(`Invalid JSON in ${usedPath}: ${e.message}${envHint}`);
      }
      throw new Error(
        `Invalid service account JSON: ${e instanceof Error ? e.message : String(e)}${envHint}`,
      );
    }
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const raw = process.env.GOOGLE_PRIVATE_KEY?.trim();
  if (!email || !raw) {
    throw new Error(
      "Google credentials are missing." +
        envHint +
        " Tip: run npm run env:check from the silver-shop folder.",
    );
  }
  return { email, privateKey: raw.replace(/\\n/g, "\n") };
}

export function getSpreadsheetId(): string {
  return process.env.GOOGLE_SPREADSHEET_ID ?? DEFAULT_SPREADSHEET_ID;
}

let docPromise: Promise<GoogleSpreadsheet> | null = null;

/** Clears the cached spreadsheet client (e.g. after fixing credentials without restarting). */
export function resetGoogleSpreadsheetClientCache(): void {
  docPromise = null;
}

/**
 * Authenticates with the service account and returns the spreadsheet document.
 * The same instance is reused for the lifetime of the Node process.
 *
 * Money cells should be written as decimal strings (e.g. `"230.00"`). The
 * `google-spreadsheet` row APIs use `valueInputOption: USER_ENTERED` by default
 * (not RAW), so Sheets parses decimals correctly for the document locale.
 */
export async function getGoogleSpreadsheet(): Promise<GoogleSpreadsheet> {
  if (!docPromise) {
    docPromise = (async () => {
      try {
        const { email, privateKey } = await getCredentials();
        const auth = new JWT({
          email,
          key: privateKey,
          scopes: SCOPES,
        });
        const doc = new GoogleSpreadsheet(getSpreadsheetId(), auth);
        await doc.loadInfo();
        return doc;
      } catch (e) {
        resetGoogleSpreadsheetClientCache();
        throw e;
      }
    })();
  }
  return docPromise;
}

/**
 * Primary entry point for “database” access: authenticated `GoogleSpreadsheet` for the target ID.
 * Alias of {@link getGoogleSpreadsheet}; use whichever name fits your module.
 */
export async function getGoogleSheetClient(): Promise<GoogleSpreadsheet> {
  return getGoogleSpreadsheet();
}
