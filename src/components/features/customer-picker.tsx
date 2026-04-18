"use client";

import type { Customer } from "@/types";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { createCustomer, type CustomerFormState } from "@/actions/customers";
import { searchCustomers } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (customerId: string) => void;
  initialCustomers: Customer[];
};

export function CustomerPicker({
  value,
  onChange,
  initialCustomers,
}: Props) {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<Customer[]>(initialCustomers);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, startSearch] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchText), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    startSearch(async () => {
      const rows = await searchCustomers(debounced);
      setResults(rows);
    });
  }, [debounced]);

  const resolved = useMemo(() => {
    if (!value) return null;
    return (
      initialCustomers.find((c) => c.id === value) ??
      results.find((c) => c.id === value) ??
      null
    );
  }, [value, initialCustomers, results]);

  const displayValue =
    focused || open ? searchText : resolved ? `${resolved.firstName} ${resolved.lastName}` : searchText;

  const [quickState, quickAction] = useActionState(
    async (
      prev: CustomerFormState,
      formData: FormData,
    ): Promise<CustomerFormState> => {
      const res = await createCustomer(prev, formData);
      if (res.success && res.customerId) {
        onChange(res.customerId);
        setDialogOpen(false);
        router.refresh();
      }
      return res;
    },
    {},
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-[200px] flex-1 space-y-1">
          <Label htmlFor="customerSearch">Customer</Label>
          <Input
            id="customerSearch"
            placeholder="Search name, phone, ID…"
            value={displayValue}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => {
              setFocused(true);
              setOpen(true);
              setSearchText(
                resolved ? `${resolved.firstName} ${resolved.lastName}` : "",
              );
            }}
            onBlur={() => {
              setFocused(false);
              setOpen(false);
            }}
            autoComplete="off"
          />
          {open && results.length > 0 && (
            <ul
              className={cn(
                "absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-md border border-zinc-200 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-950",
              )}
              role="listbox"
            >
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(c.id);
                      setSearchText(`${c.firstName} ${c.lastName}`);
                      setOpen(false);
                      setFocused(false);
                    }}
                  >
                    <span className="font-medium">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {c.phone} · {c.personalId}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="secondary">
              Quick add customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New customer</DialogTitle>
              <DialogDescription>
                Creates a customer and selects them for this order.
              </DialogDescription>
            </DialogHeader>
            <form action={quickAction} className="grid gap-3">
              <div className="grid gap-1">
                <Label htmlFor="qa-first">First name</Label>
                <Input id="qa-first" name="firstName" required />
                {quickState.fieldErrors?.firstName ? (
                  <p className="text-xs text-red-600">
                    {quickState.fieldErrors.firstName}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-1">
                <Label htmlFor="qa-last">Last name</Label>
                <Input id="qa-last" name="lastName" required />
                {quickState.fieldErrors?.lastName ? (
                  <p className="text-xs text-red-600">
                    {quickState.fieldErrors.lastName}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-1">
                <Label htmlFor="qa-phone">Phone</Label>
                <Input id="qa-phone" name="phone" required />
                {quickState.fieldErrors?.phone ? (
                  <p className="text-xs text-red-600">
                    {quickState.fieldErrors.phone}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-1">
                <Label htmlFor="qa-pid">Personal ID</Label>
                <Input id="qa-pid" name="personalId" required />
                {quickState.fieldErrors?.personalId ? (
                  <p className="text-xs text-red-600">
                    {quickState.fieldErrors.personalId}
                  </p>
                ) : null}
              </div>
              {quickState.error ? (
                <p className="text-sm text-red-600">{quickState.error}</p>
              ) : null}
              <Button type="submit">Create &amp; select</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {resolved ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Selected:{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {resolved.firstName} {resolved.lastName}
          </span>{" "}
          ({resolved.personalId})
        </p>
      ) : value ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Selected customer not in current search — ID is set.
        </p>
      ) : (
        <p className="text-sm text-zinc-500">Choose a customer for this order.</p>
      )}
      <input type="hidden" name="customerId" value={value} readOnly />
    </div>
  );
}
