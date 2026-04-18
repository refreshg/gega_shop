"use client";

import type { Customer, Product } from "@/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createSalesOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomerPicker } from "./customer-picker";

type Line = {
  productId: string;
  quantity: number;
  description: string;
  unitPrice: string;
};

const emptyLine = (): Line => ({
  productId: "",
  quantity: 1,
  description: "",
  unitPrice: "",
});

type Props = {
  customers: Customer[];
  products: Product[];
};

export function NewOrderForm({ customers, products }: Props) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [isConsignment, setIsConsignment] = useState(false);
  const [initialPayment, setInitialPayment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const lineItemsJson = useMemo(
    () =>
      JSON.stringify(
        lines.map((l) => ({
          productId: l.productId || undefined,
          quantity: l.quantity,
          description: l.description,
          unitPrice: l.unitPrice,
        })),
      ),
    [lines],
  );

  function applyProductDefaults(index: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    setLines((prev) => {
      const next = [...prev];
      const row = { ...next[index] };
      row.productId = productId;
      if (p) {
        row.description = p.name;
        if (p.priceMinor != null) {
          row.unitPrice = (p.priceMinor / 100).toFixed(2);
        }
      }
      next[index] = row;
      return next;
    });
  }

  return (
    <form
      className="mx-auto max-w-3xl space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        fd.set("lineItemsJson", lineItemsJson);
        startTransition(async () => {
          const res = await createSalesOrder(fd);
          if (res.ok) {
            router.push(`/orders/${res.orderId}`);
            router.refresh();
          } else {
            setError(res.error);
          }
        });
      }}
    >
      <CustomerPicker
        value={customerId}
        onChange={setCustomerId}
        initialCustomers={customers}
      />

      <div className="space-y-2">
        <Label>Line items</Label>
        <div className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          {lines.map((line, i) => (
            <div
              key={i}
              className="grid gap-3 border-b border-zinc-100 pb-4 last:border-0 dark:border-zinc-800 md:grid-cols-[1.2fr_0.5fr_1.2fr_0.8fr_auto]"
            >
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">Product</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  value={line.productId}
                  onChange={(e) => applyProductDefaults(i, e.target.value)}
                >
                  <option value="">Custom line</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">Qty</Label>
                <Input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) =>
                    setLines((prev) => {
                      const n = [...prev];
                      n[i] = {
                        ...n[i],
                        quantity: Math.max(1, Number(e.target.value) || 1),
                      };
                      return n;
                    })
                  }
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs text-zinc-500">Description</Label>
                <Input
                  value={line.description}
                  onChange={(e) =>
                    setLines((prev) => {
                      const n = [...prev];
                      n[i] = { ...n[i], description: e.target.value };
                      return n;
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">Unit price</Label>
                <Input
                  inputMode="decimal"
                  value={line.unitPrice}
                  onChange={(e) =>
                    setLines((prev) => {
                      const n = [...prev];
                      n[i] = { ...n[i], unitPrice: e.target.value };
                      return n;
                    })
                  }
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={lines.length <= 1}
                  onClick={() =>
                    setLines((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
          >
            Add line
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentTerms">Payment terms</Label>
        <Textarea
          id="paymentTerms"
          name="paymentTerms"
          value={paymentTerms}
          onChange={(e) => setPaymentTerms(e.target.value)}
          required
          placeholder="e.g. 50% upfront, balance in 30 days; or consignment terms…"
          rows={4}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Checkbox
          id="isConsignment"
          checked={isConsignment}
          onCheckedChange={(v) => setIsConsignment(v === true)}
        />
        <input
          type="hidden"
          name="isConsignment"
          value={isConsignment ? "true" : "false"}
          readOnly
        />
        <Label htmlFor="isConsignment" className="cursor-pointer">
          Consignment (no initial payment expected at creation)
        </Label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="initialPayment">Initial payment (optional)</Label>
          <Input
            id="initialPayment"
            name="initialPayment"
            value={initialPayment}
            onChange={(e) => setInitialPayment(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment method (if paying now)</Label>
          <Input
            id="paymentMethod"
            name="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="Cash, card, transfer…"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={pending || !customerId}>
        {pending ? "Creating…" : "Create sales order"}
      </Button>
    </form>
  );
}
