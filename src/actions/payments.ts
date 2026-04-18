"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require";
import { addPaymentAndUpdateStatus } from "@/lib/db/payments";
import { invalidateSheetDbCache } from "@/lib/db/invalidate";
import { parseMoneyToMinor } from "@/lib/money";

const addPaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.string().min(1, "Amount is required"),
  method: z.string().min(1, "Method is required"),
  paymentDate: z.string().optional(),
});

export type AddPaymentResult =
  | { ok: true }
  | { ok: false; error: string };

export async function addPaymentToOrder(
  _prev: AddPaymentResult | undefined,
  formData: FormData,
): Promise<AddPaymentResult> {
  const parsed = addPaymentSchema.safeParse({
    orderId: String(formData.get("orderId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    method: String(formData.get("method") ?? ""),
    paymentDate: formData.get("paymentDate")
      ? String(formData.get("paymentDate"))
      : undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const amountMinor = parseMoneyToMinor(parsed.data.amount);
  if (amountMinor <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  const paymentDate = parsed.data.paymentDate
    ? new Date(parsed.data.paymentDate)
    : new Date();
  if (Number.isNaN(paymentDate.getTime())) {
    return { ok: false, error: "Invalid date." };
  }

  const session = await requireSession();
  try {
    await addPaymentAndUpdateStatus({
      orderId: parsed.data.orderId,
      amountPaidMinor: amountMinor,
      method: parsed.data.method,
      paymentDate,
      processedBy: session.name,
    });

    invalidateSheetDbCache();
    revalidatePath("/orders");
    revalidatePath(`/orders/${parsed.data.orderId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not record payment.";
    return { ok: false, error: msg };
  }
}
