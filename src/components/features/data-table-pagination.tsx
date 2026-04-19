"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DATA_TABLE_PAGE_SIZE = 20;

function buildPageList(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i];
    if (i > 0 && n - sorted[i - 1]! > 1) {
      out.push("ellipsis");
    }
    out.push(n);
  }
  return out;
}

export function DataTablePagination({
  page,
  totalItems,
  onPageChange,
  pageSize = DATA_TABLE_PAGE_SIZE,
  className,
}: {
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const from = totalItems === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, totalItems);

  if (totalItems === 0) {
    return null;
  }

  const pageItems = buildPageList(current, totalPages);

  return (
    <nav
      className={cn(
        "flex flex-col items-stretch gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      aria-label="Table pagination"
    >
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400 sm:text-left">
        Showing{" "}
        <span className="tabular-nums">
          {from}–{to}
        </span>{" "}
        of <span className="tabular-nums">{totalItems}</span>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label="Previous page"
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span>Previous</span>
        </Button>
        {pageItems.map((item, idx) =>
          item === "ellipsis" ? (
            <span
              key={`e-${idx}`}
              className="px-1.5 text-zinc-500 dark:text-zinc-400"
              aria-hidden
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={item === current ? "default" : "outline"}
              size="sm"
              className="min-w-9 tabular-nums"
              onClick={() => onPageChange(item)}
              aria-label={`Page ${item}`}
              aria-current={item === current ? "page" : undefined}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
          aria-label="Next page"
          className="gap-1"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
