"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  appendCustomer,
  deleteCustomerRow,
  findCustomerByPersonalId,
  updateCustomerRow,
} from "@/lib/db/customers";
import { invalidateSheetDbCache } from "@/lib/db/invalidate";
import { listPayments, listSalesOrders } from "@/lib/db/sales-orders";
import { remainingDebtMinor } from "@/lib/money";

const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  personalId: z.string().min(1, "Personal ID is required"),
});

export type CustomerFormState = {
  error?: string;
  success?: boolean;
  customerId?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof customerSchema>, string>>;
};

export async function createCustomer(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    personalId: formData.get("personalId"),
  };
  const parsed = customerSchema.safeParse({
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    phone: String(raw.phone ?? ""),
    personalId: String(raw.personalId ?? ""),
  });
  if (!parsed.success) {
    const fe: CustomerFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof typeof fe;
      if (k) fe[k] = issue.message;
    }
    return { fieldErrors: fe };
  }
  try {
    const existing = await findCustomerByPersonalId(parsed.data.personalId);
    if (existing) {
      return { error: "Personal ID is already registered." };
    }
    const created = await appendCustomer(parsed.data);
    invalidateSheetDbCache();
    revalidatePath("/customers");
    revalidatePath("/orders/new");
    return { success: true, customerId: created.id };
  } catch {
    return { error: "Could not save customer." };
  }
}

export async function updateCustomer(
  customerId: string,
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    personalId: formData.get("personalId"),
  };
  const parsed = customerSchema.safeParse({
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    phone: String(raw.phone ?? ""),
    personalId: String(raw.personalId ?? ""),
  });
  if (!parsed.success) {
    const fe: CustomerFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof typeof fe;
      if (k) fe[k] = issue.message;
    }
    return { fieldErrors: fe };
  }
  try {
    const other = await findCustomerByPersonalId(parsed.data.personalId);
    if (other && other.id !== customerId) {
      return { error: "Personal ID is already registered." };
    }
    await updateCustomerRow(customerId, parsed.data);
    invalidateSheetDbCache();
    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);
    return { success: true };
  } catch {
    return { error: "Could not update customer." };
  }
}

export type DeleteCustomerResult = { ok: true } | { ok: false; message: string };

export async function deleteCustomer(customerId: string): Promise<DeleteCustomerResult> {
  const orders = (await listSalesOrders()).filter((o) => o.customerId === customerId);
  const payments = await listPayments();
  const hasOutstanding = orders.some((o) => {
    const ps = payments.filter((p) => p.orderId === o.id);
    return remainingDebtMinor(o.totalAmount, ps) > 0;
  });
  if (hasOutstanding) {
    return {
      ok: false,
      message:
        "Cannot delete this customer while they have orders with an outstanding balance.",
    };
  }
  if (orders.length > 0) {
    return {
      ok: false,
      message:
        "Cannot delete this customer while they have sales orders. Remove orders from the spreadsheet first.",
    };
  }
  try {
    await deleteCustomerRow(customerId);
    invalidateSheetDbCache();
    revalidatePath("/customers");
    revalidatePath("/");
    revalidatePath("/orders");
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Could not delete customer.",
    };
  }
}
