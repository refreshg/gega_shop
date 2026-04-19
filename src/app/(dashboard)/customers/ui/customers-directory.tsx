"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DATA_TABLE_PAGE_SIZE,
  DataTablePagination,
} from "@/components/features/data-table-pagination";
import { SortableTableHead } from "@/components/features/sortable-table-head";
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
import { deleteCustomer } from "@/actions/customers";
import { DeleteRowButton } from "@/components/features/delete-row-button";
import { timestampInLocalDayRange } from "@/lib/date-filters";
import { formatDate } from "@/lib/utils";

export type CustomerListItem = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  personalId: string;
  createdAt: string;
  /** Who created the row (from sheet `createdBy`). */
  createdBy: string;
};

type CustomerSortKey = "name" | "created";

const DEFAULT_SORT: Record<CustomerSortKey, "asc" | "desc"> = {
  name: "asc",
  created: "desc",
};

function customerFullName(c: CustomerListItem): string {
  return `${c.firstName} ${c.lastName}`.trim();
}

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

function emptyDirectoryMessage(
  query: string,
  dateFrom: string,
  dateTo: string,
): string {
  const hasSearch = query.trim().length > 0;
  const hasDate = Boolean(dateFrom || dateTo);
  if (hasSearch && hasDate) {
    return "No contacts match your search and date range.";
  }
  if (hasSearch) {
    return `No results found for "${query.trim()}"`;
  }
  if (hasDate) {
    return "No contacts in this date range.";
  }
  return "No results match your filters.";
}

export function CustomersDirectory({
  customers,
}: {
  customers: CustomerListItem[];
}) {
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<CustomerSortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(
    DEFAULT_SORT.name,
  );

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        if (!matchesCustomerQuery(c, query)) return false;
        return timestampInLocalDayRange(c.createdAt, dateFrom, dateTo);
      }),
    [customers, query, dateFrom, dateTo],
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = customerFullName(a).localeCompare(customerFullName(b), undefined, {
          sensitivity: "base",
        });
      } else {
        cmp =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(
    1,
    Math.ceil(sorted.length / DATA_TABLE_PAGE_SIZE),
  );

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * DATA_TABLE_PAGE_SIZE;
    return sorted.slice(start, start + DATA_TABLE_PAGE_SIZE);
  }, [sorted, safePage]);

  function handleSort(key: CustomerSortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(DEFAULT_SORT[key]);
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  }

  const hasActiveFilters =
    query.trim().length > 0 || Boolean(dateFrom || dateTo);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Directory</CardTitle>
          <CardDescription>
            {hasActiveFilters
              ? `${filtered.length} of ${customers.length} contacts`
              : `${customers.length} contacts`}
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/orders/new">New order</Link>
        </Button>
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
              placeholder="Search by name, phone, or personal ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              aria-label="Search customers"
            />
          </div>
          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="grid w-full min-w-[9rem] max-w-[11rem] gap-1.5">
              <Label htmlFor="customers-date-from" className="text-xs">
                From (added)
              </Label>
              <Input
                id="customers-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="grid w-full min-w-[9rem] max-w-[11rem] gap-1.5">
              <Label htmlFor="customers-date-to" className="text-xs">
                To
              </Label>
              <Input
                id="customers-date-to"
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
                <SortableTableHead
                  label="Name"
                  isActive={sortKey === "name"}
                  direction={sortKey === "name" ? sortDir : null}
                  onSort={() => handleSort("name")}
                />
                <TableHead>Phone</TableHead>
                <TableHead>Personal ID</TableHead>
                <TableHead className="hidden lg:table-cell">Added by</TableHead>
                <SortableTableHead
                  label="Since"
                  isActive={sortKey === "created"}
                  direction={sortKey === "created" ? sortDir : null}
                  onSort={() => handleSort("created")}
                />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-500">
                    No customers yet.
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-500">
                    {emptyDirectoryMessage(query, dateFrom, dateTo)}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <div>{c.firstName} {c.lastName}</div>
                      {c.createdBy ? (
                        <p className="mt-0.5 text-xs font-normal text-zinc-500 lg:hidden">
                          By {c.createdBy}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {c.personalId}
                    </TableCell>
                    <TableCell className="hidden text-sm text-zinc-600 lg:table-cell">
                      {c.createdBy || "—"}
                    </TableCell>
                    <TableCell className="text-zinc-600">
                      {formatDate(new Date(c.createdAt))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/customers/${c.id}`}>View</Link>
                        </Button>
                        <DeleteRowButton
                          id={c.id}
                          entity="Customer"
                          deleteAction={deleteCustomer}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {customers.length > 0 && filtered.length > 0 ? (
          <DataTablePagination
            page={safePage}
            totalItems={sorted.length}
            onPageChange={setPage}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
