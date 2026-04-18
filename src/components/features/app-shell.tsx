import Link from "next/link";
import { type ReactNode } from "react";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const baseNav = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/orders", label: "Sales orders" },
  { href: "/products", label: "Products" },
] as const;

export function AppShell({
  children,
  className,
  userName,
  showUsersNav,
}: {
  children: ReactNode;
  className?: string;
  /** Signed-in display name from session (optional when not yet loaded). */
  userName?: string;
  /** Show /users link (admins only). */
  showUsersNav?: boolean;
}) {
  const nav = showUsersNav
    ? [...baseNav, { href: "/users" as const, label: "Users" }]
    : [...baseNav];

  return (
    <div className={cn("flex min-h-full flex-1 flex-col md:flex-row", className)}>
      <aside className="border-b border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 md:w-56 md:border-b-0 md:border-r md:py-8">
        <div className="mb-6 px-2">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Silver Shop
          </Link>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Sales &amp; debt
          </p>
          {userName ? (
            <p className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              {userName}
            </p>
          ) : null}
        </div>
        <nav className="flex flex-wrap gap-2 md:flex-col md:gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-4 px-2">
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Log out
          </Button>
        </form>
      </aside>
      <main className="flex flex-1 flex-col p-6 md:p-10">{children}</main>
    </div>
  );
}
