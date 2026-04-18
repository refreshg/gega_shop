"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";
import { findUserByPin } from "@/lib/db/users";

const pinSchema = z
  .string()
  .regex(/^\d{4}$/, "Enter a 4-digit PIN.");

export type LoginState = { error?: string };

export async function loginWithPin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = String(formData.get("pin") ?? "");
  const parsed = pinSchema.safeParse(raw.trim());
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid PIN" };
  }

  let user;
  try {
    user = await findUserByPin(parsed.data);
  } catch {
    return {
      error:
        "Could not verify PIN. Check Google Sheets credentials and network.",
    };
  }
  if (!user) {
    return { error: "PIN not recognized." };
  }

  const token = await createSessionToken({
    userId: user.id,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);
  redirect("/");
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
