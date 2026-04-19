"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  DATA_TABLE_PAGE_SIZE,
  DataTablePagination,
} from "@/components/features/data-table-pagination";
import { SortableTableHead } from "@/components/features/sortable-table-head";
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
import { deleteProduct } from "@/actions/products";
import { DeleteRowButton } from "@/components/features/delete-row-button";
import { formatMinorAsCurrency } from "@/lib/money";

export type ProductListItem = {
  id: string;
  name: string;
  description: string | null;
  priceMinor: number | null;
  stock: number;
  createdBy: string;
};

type ProductSortKey = "name" | "price" | "stock";

const DEFAULT_SORT: Record<ProductSortKey, "asc" | "desc"> = {
  name: "asc",
  price: "asc",
  stock: "desc",
};

function matchesProductQuery(p: ProductListItem, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const desc = (p.description ?? "").toLowerCase();
  return p.name.toLowerCase().includes(s) || desc.includes(s);
}

function comparePrice(a: ProductListItem, b: ProductListItem): number {
  const pa = a.priceMinor;
  const pb = b.priceMinor;
  if (pa == null && pb == null) return 0;
  if (pa == null) return 1;
  if (pb == null) return -1;
  return pa - pb;
}

export function ProductsCatalog({ products }: { products: ProductListItem[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<ProductSortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(
    DEFAULT_SORT.name,
  );

  const filtered = useMemo(
    () => products.filter((p) => matchesProductQuery(p, query)),
    [products, query],
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      } else if (sortKey === "price") {
        cmp = comparePrice(a, b);
      } else {
        cmp = a.stock - b.stock;
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

  function handleSort(key: ProductSortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(DEFAULT_SORT[key]);
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catalog</CardTitle>
        <CardDescription>
          {query.trim()
            ? `${filtered.length} of ${products.length} products`
            : `${products.length} products`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search by name or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search products"
          />
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
                <TableHead>Description</TableHead>
                <SortableTableHead
                  label="Default price"
                  isActive={sortKey === "price"}
                  direction={sortKey === "price" ? sortDir : null}
                  onSort={() => handleSort("price")}
                />
                <SortableTableHead
                  label="Stock"
                  isActive={sortKey === "stock"}
                  direction={sortKey === "stock" ? sortDir : null}
                  onSort={() => handleSort("stock")}
                />
                <TableHead className="hidden md:table-cell">Added by</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-500">
                    No products yet.
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-500">
                    No results found for &quot;{query.trim()}&quot;
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <div>{p.name}</div>
                      {p.createdBy ? (
                        <p className="mt-0.5 text-xs font-normal text-zinc-500 md:hidden">
                          By {p.createdBy}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-zinc-600">
                      {p.description ?? "—"}
                    </TableCell>
                    <TableCell className="font-variant-numeric tabular-nums">
                      {p.priceMinor != null
                        ? formatMinorAsCurrency(p.priceMinor)
                        : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">{p.stock}</TableCell>
                    <TableCell className="hidden text-sm text-zinc-600 md:table-cell">
                      {p.createdBy || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end">
                        <DeleteRowButton
                          id={p.id}
                          entity="Product"
                          deleteAction={deleteProduct}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {products.length > 0 && filtered.length > 0 ? (
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
