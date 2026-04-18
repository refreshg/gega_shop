/**
 * Loads .env.local from the project root and reports whether Google env vars are set.
 * Run: npm run env:check   (from the folder that contains package.json)
 */
const { config } = require("dotenv");
const { resolve } = require("path");

const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
const key = process.env.GOOGLE_PRIVATE_KEY?.trim();

console.log("Project root (expected):", root);
console.log("");

if (credPath) {
  console.log("GOOGLE_APPLICATION_CREDENTIALS:", credPath);
  console.log("  -> Using JSON file path (recommended).");
} else {
  console.log("GOOGLE_APPLICATION_CREDENTIALS: (not set)");
}

if (email) {
  console.log("GOOGLE_SERVICE_ACCOUNT_EMAIL:", "SET (length " + email.length + ")");
} else {
  console.log("GOOGLE_SERVICE_ACCOUNT_EMAIL: MISSING or EMPTY");
}

if (key) {
  console.log("GOOGLE_PRIVATE_KEY:", "SET (length " + key.length + ")");
} else {
  console.log("GOOGLE_PRIVATE_KEY: MISSING or EMPTY");
}

console.log("");

const ok = credPath || (email && key);
if (ok) {
  console.log("Result: OK — Next.js can load credentials (restart dev server if you just edited .env.local).");
  process.exit(0);
} else {
  console.log("Result: NOT OK — Set GOOGLE_APPLICATION_CREDENTIALS to your JSON path, OR set both email and private key.");
  process.exit(1);
}
