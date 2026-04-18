"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

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
};

function matchesProductQuery(p: ProductListItem, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const desc = (p.description ?? "").toLowerCase();
  return p.name.toLowerCase().includes(s) || desc.includes(s);
}

export function ProductsCatalog({ products }: { products: ProductListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => products.filter((p) => matchesProductQuery(p, query)),
    [products, query],
  );

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
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Default price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-zinc-500">
                    No products yet.
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-zinc-500">
                    No results found for &quot;{query.trim()}&quot;
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-zinc-600">
                      {p.description ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {p.priceMinor != null
                        ? formatMinorAsCurrency(p.priceMinor)
                        : "—"}
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
      </CardContent>
    </Card>
  );
}
