"use server";

import type { SalesOrderStatus } from "@/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require";
import { listCustomersCached } from "@/lib/db/customers";
import { invalidateSheetDbCache } from "@/lib/db/invalidate";
import {
  createOrderSequential,
  deleteSalesOrderCascade,
  getSalesOrderById,
} from "@/lib/db/sales-orders";
import { lineTotalMinor, parseMoneyToMinor } from "@/lib/money";
import { computeInitialStatus } from "@/lib/order-status";

const lineItemSchema = z.object({
  productId: z.string().optional(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  description: z.string().min(1, "Description required"),
  unitPrice: z.string().min(1, "Price required"),
});

const createOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  isConsignment: z
    .union([z.string(), z.boolean()])
    .transform((v) => v === true || v === "true" || v === "on"),
  initialPayment: z.string().optional(),
  paymentMethod: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line"),
});

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function createSalesOrder(formData: FormData): Promise<CreateOrderResult> {
  let lineItemsParsed: z.infer<typeof lineItemSchema>[] = [];
  try {
    const json = formData.get("lineItemsJson");
    if (typeof json === "string" && json) {
      const arr = JSON.parse(json) as unknown;
      if (!Array.isArray(arr)) throw new Error("Invalid lines");
      lineItemsParsed = arr.map((row) => lineItemSchema.parse(row));
    }
  } catch {
    return { ok: false, error: "Invalid line items." };
  }

  if (lineItemsParsed.length === 0) {
    return { ok: false, error: "Add at least one line item." };
  }

  const initialPaymentStr = String(formData.get("initialPayment") ?? "");
  const paymentMethod = String(formData.get("paymentMethod") ?? "").trim();

  const body = createOrderSchema.safeParse({
    customerId: String(formData.get("customerId") ?? ""),
    paymentTerms: String(formData.get("paymentTerms") ?? ""),
    isConsignment: formData.get("isConsignment"),
    initialPayment: initialPaymentStr,
    paymentMethod,
    lineItems: lineItemsParsed,
  });

  if (!body.success) {
    return { ok: false, error: body.error.issues[0]?.message ?? "Invalid form" };
  }

  const lines = body.data.lineItems.map((li) => {
    const unitPriceMinor = parseMoneyToMinor(li.unitPrice);
    return {
      productId: li.productId && li.productId !== "" ? li.productId : null,
      quantity: li.quantity,
      description: li.description,
      unitPriceMinor,
      lineTotal: lineTotalMinor(li.quantity, unitPriceMinor),
    };
  });

  const totalMinor = lines.reduce((s, l) => s + l.lineTotal, 0);
  const initialPaymentMinor = parseMoneyToMinor(body.data.initialPayment ?? "");
  if (initialPaymentMinor < 0) {
    return { ok: false, error: "Initial payment cannot be negative." };
  }
  if (initialPaymentMinor > totalMinor) {
    return { ok: false, error: "Initial payment cannot exceed order total." };
  }

  if (initialPaymentMinor > 0 && !paymentMethod) {
    return {
      ok: false,
      error: "Payment method is required when recording an initial payment.",
    };
  }

  const status: SalesOrderStatus = computeInitialStatus({
    totalMinor,
    initialPaymentMinor,
    isConsignment: body.data.isConsignment,
  });

  const session = await requireSession();
  try {
    const { orderId } = await createOrderSequential({
      customerId: body.data.customerId,
      totalAmount: totalMinor,
      status,
      paymentTerms: body.data.paymentTerms,
      isConsignment: body.data.isConsignment,
      lineItems: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPriceMinor: l.unitPriceMinor,
        description: l.description,
      })),
      initialPayment:
        initialPaymentMinor > 0
          ? {
              amountMinor: initialPaymentMinor,
              method: paymentMethod || "Unknown",
              paymentDate: new Date(),
            }
          : undefined,
      createdBy: session.name,
      processedBy: session.name,
    });

    invalidateSheetDbCache();
    revalidatePath("/orders");
    revalidatePath("/");
    revalidatePath(`/customers/${body.data.customerId}`);
    return { ok: true, orderId };
  } catch (e) {
    console.error(e);
    const msg =
      e instanceof Error ? e.message : "Could not create order in Google Sheets.";
    return { ok: false, error: msg };
  }
}

export type DeleteOrderResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deleteOrder(orderId: string): Promise<DeleteOrderResult> {
  await requireSession();
  const order = await getSalesOrderById(orderId);
  if (!order) {
    return { ok: false, message: "Order not found." };
  }
  try {
    await deleteSalesOrderCascade(orderId);
    invalidateSheetDbCache();
    revalidatePath("/orders");
    revalidatePath("/");
    revalidatePath(`/customers/${order.customerId}`);
    revalidatePath(`/orders/${orderId}`);
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not delete order." };
  }
}

export async function searchCustomers(q: string) {
  const term = q.trim().toLowerCase();
  const all = await listCustomersCached();
  if (!term) return all.slice(0, 50);
  return all
    .filter(
      (c) =>
        c.firstName.toLowerCase().includes(term) ||
        c.lastName.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        c.personalId.toLowerCase().includes(term),
    )
    .slice(0, 50);
}
