"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { invalidateSheetDbCache } from "@/lib/db/invalidate";
import { appendProduct } from "@/lib/db/products";
import { parseMoneyToMinor } from "@/lib/money";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.string().optional(),
});

export type ProductFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
};

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
  };
  const parsed = productSchema.safeParse({
    name: String(raw.name ?? ""),
    description: raw.description ? String(raw.description) : undefined,
    price: raw.price != null ? String(raw.price) : "",
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fe[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors: fe };
  }
  const priceMinor =
    parsed.data.price && parsed.data.price.trim() !== ""
      ? parseMoneyToMinor(parsed.data.price)
      : null;
  try {
    await appendProduct({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      priceMinor,
    });
    invalidateSheetDbCache();
    revalidatePath("/products");
    revalidatePath("/orders/new");
    return { success: true };
  } catch {
    return { error: "Could not save product." };
  }
}
