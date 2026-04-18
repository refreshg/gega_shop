"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require";
import { invalidateSheetDbCache } from "@/lib/db/invalidate";
import {
  appendUser,
  deleteUserRow,
  listUsers,
  updateUserRow,
} from "@/lib/db/users";
import type { ShopUserRole } from "@/types";

const pinSchema = z
  .string()
  .regex(/^\d{4}$/, "PIN must be exactly 4 digits.");

const userBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  pin: pinSchema,
  role: z.enum(["admin", "staff"]),
});

export type UserFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Partial<Record<"name" | "pin" | "role", string>>;
};

async function assertPinUnique(
  pin: string,
  exceptUserId?: string,
): Promise<string | null> {
  const users = await listUsers();
  const clash = users.find(
    (u) => u.pin === pin && (!exceptUserId || u.id !== exceptUserId),
  );
  return clash ? "This PIN is already assigned to another user." : null;
}

export async function createUserAction(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin();
  const parsed = userBodySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    pin: String(formData.get("pin") ?? ""),
    role: String(formData.get("role") ?? "staff"),
  });
  if (!parsed.success) {
    const fe: UserFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof typeof fe;
      if (k) fe[k] = issue.message;
    }
    return { fieldErrors: fe };
  }
  const uniqueErr = await assertPinUnique(parsed.data.pin);
  if (uniqueErr) return { error: uniqueErr };
  try {
    await appendUser({
      name: parsed.data.name.trim(),
      pin: parsed.data.pin,
      role: parsed.data.role as ShopUserRole,
    });
    invalidateSheetDbCache();
    revalidatePath("/users");
    return { success: true };
  } catch {
    return { error: "Could not save user." };
  }
}

export async function updateUserAction(
  userId: string,
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin();
  const parsed = userBodySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    pin: String(formData.get("pin") ?? ""),
    role: String(formData.get("role") ?? "staff"),
  });
  if (!parsed.success) {
    const fe: UserFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof typeof fe;
      if (k) fe[k] = issue.message;
    }
    return { fieldErrors: fe };
  }
  const uniqueErr = await assertPinUnique(parsed.data.pin, userId);
  if (uniqueErr) return { error: uniqueErr };
  try {
    await updateUserRow(userId, {
      name: parsed.data.name.trim(),
      pin: parsed.data.pin,
      role: parsed.data.role as ShopUserRole,
    });
    invalidateSheetDbCache();
    revalidatePath("/users");
    return { success: true };
  } catch {
    return { error: "Could not update user." };
  }
}

export type DeleteUserResult = { ok: true } | { ok: false; message: string };

export async function deleteUserAction(userId: string): Promise<DeleteUserResult> {
  const session = await requireAdmin();
  if (session.userId === userId) {
    return { ok: false, message: "You cannot delete your own account." };
  }
  try {
    await deleteUserRow(userId);
    invalidateSheetDbCache();
    revalidatePath("/users");
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not delete user." };
  }
}
