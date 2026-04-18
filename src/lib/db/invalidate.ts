import { revalidateTag } from "next/cache";

/** Call after any Google Sheets mutation so `unstable_cache` readers refresh. */
export function invalidateSheetDbCache(): void {
  revalidateTag("sheet-db", "default");
}
