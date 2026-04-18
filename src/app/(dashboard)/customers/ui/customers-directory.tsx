"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export type CustomerListItem = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  personalId: string;
  createdAt: string;
};

function matchesCustomerQuery(c: CustomerListItem, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return (
    c.firstName.toLowerCase().includes(s) ||
    c.lastName.toLowerCase().includes(s) ||
    c.phone.toLowerCase().includes(s) ||
    c.personalId.toLowerCase().includes(s)
  );
}

export function CustomersDirectory({
  customers,
}: {
  customers: CustomerListItem[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => customers.filter((c) => matchesCustomerQuery(c, query)),
    [customers, query],
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Directory</CardTitle>
          <CardDescription>
            {query.trim()
              ? `${filtered.length} of ${customers.length} customers`
              : `${customers.length} customers`}
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/orders/new">New order</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search by name, phone, or personal ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search customers"
          />
        </div>

        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Personal ID</TableHead>
                <TableHead>Since</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-zinc-500">
                    No customers yet.
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-zinc-500">
                    No results found for &quot;{query.trim()}&quot;
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.firstName} {c.lastName}
                    </TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {c.personalId}
                    </TableCell>
                    <TableCell className="text-zinc-600">
                      {formatDate(new Date(c.createdAt))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/customers/${c.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
