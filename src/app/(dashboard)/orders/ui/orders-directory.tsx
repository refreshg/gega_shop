"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { OrderStatusBadge } from "@/components/features/order-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { timestampInLocalDayRange } from "@/lib/date-filters";
import { formatMinorAsCurrency } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import type { SalesOrderStatus } from "@/types";

export type OrderDirectoryRow = {
  id: string;
  createdAt: string;
  status: SalesOrderStatus;
  totalAmount: number;
  remaining: number;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  searchBlob: string;
};

const filters: { label: string; value: SalesOrderStatus | null }[] = [
  { label: "All", value: null },
  { label: "Unpaid", value: "UNPAID" },
  { label: "Partially paid", value: "PARTIALLY_PAID" },
  { label: "Consignment", value: "CONSIGNMENT" },
  { label: "Paid", value: "PAID" },
];

function emptyOrdersMessage(
  query: string,
  dateFrom: string,
  dateTo: string,
  statusFilter: SalesOrderStatus | null,
): string {
  const has =
    query.trim().length > 0 ||
    Boolean(dateFrom || dateTo) ||
    statusFilter != null;
  if (has) return "No orders match your filters.";
  return "No orders yet.";
}

export function OrdersDirectory({
  rows,
  initialStatusFilter,
}: {
  rows: OrderDirectoryRow[];
  initialStatusFilter: SalesOrderStatus | null;
}) {
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | null>(
    initialStatusFilter,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!timestampInLocalDayRange(r.createdAt, dateFrom, dateTo)) return false;
      if (!q) return true;
      return r.searchBlob.includes(q);
    });
  }, [rows, query, dateFrom, dateTo, statusFilter]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    Boolean(dateFrom || dateTo) ||
    statusFilter != null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active =
            (f.value == null && statusFilter == null) ||
            f.value === statusFilter;
          return (
            <Button
              key={f.label}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {hasActiveFilters
              ? `${filtered.length} of ${rows.length} orders match`
              : `${filtered.length} orders in this view`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="relative w-full min-w-0 max-w-md flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search by customer, order ID, status, or product…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                aria-label="Search orders"
              />
            </div>
            <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="grid w-full min-w-[9rem] max-w-[11rem] gap-1.5">
                <Label htmlFor="orders-date-from" className="text-xs">
                  From (order date)
                </Label>
                <Input
                  id="orders-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="grid w-full min-w-[9rem] max-w-[11rem] gap-1.5">
                <Label htmlFor="orders-date-to" className="text-xs">
                  To
                </Label>
                <Input
                  id="orders-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full"
                />
              </div>
              {dateFrom || dateTo ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 self-end sm:mb-0.5"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                >
                  Clear dates
                </Button>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-zinc-500"
                    >
                      No orders yet.
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-zinc-500"
                    >
                      {emptyOrdersMessage(
                        query,
                        dateFrom,
                        dateTo,
                        statusFilter,
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="whitespace-nowrap text-zinc-600">
                        {formatDate(new Date(o.createdAt))}
                      </TableCell>
                      <TableCell>
                        <Link
                          className="font-medium hover:underline"
                          href={`/customers/${o.customerId}`}
                        >
                          {o.customerFirstName || o.customerLastName
                            ? `${o.customerFirstName} ${o.customerLastName}`.trim()
                            : "Unknown customer"}
                        </Link>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatMinorAsCurrency(o.totalAmount)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatMinorAsCurrency(o.remaining)}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/orders/${o.id}`}>View</Link>
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
    </>
  );
}
