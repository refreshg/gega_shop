"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function SortableTableHead({
  label,
  isActive,
  direction,
  onSort,
  className,
}: {
  label: string;
  isActive: boolean;
  direction: "asc" | "desc" | null;
  onSort: () => void;
  className?: string;
}) {
  return (
    <TableHead className={cn(className)}>
      <button
        type="button"
        onClick={onSort}
        className="-mx-1 -my-0.5 inline-flex max-w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      >
        <span>{label}</span>
        {isActive && direction === "asc" ? (
          <ArrowUp className="h-4 w-4 shrink-0 text-zinc-950 dark:text-zinc-50" aria-hidden />
        ) : isActive && direction === "desc" ? (
          <ArrowDown className="h-4 w-4 shrink-0 text-zinc-950 dark:text-zinc-50" aria-hidden />
        ) : (
          <ArrowUpDown
            className="h-4 w-4 shrink-0 opacity-45 dark:opacity-50"
            aria-hidden
          />
        )}
      </button>
    </TableHead>
  );
}
