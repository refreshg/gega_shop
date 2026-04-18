import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export function isAdminRole(role: string): boolean {
  return role === "admin";
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!isAdminRole(session.role)) redirect("/");
  return session;
}
