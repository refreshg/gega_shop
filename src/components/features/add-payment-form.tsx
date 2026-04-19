"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { addPaymentToOrder, type AddPaymentResult } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { CurrencyField } from "@/components/features/currency-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMinorAsCurrency } from "@/lib/money";

type Props = {
  orderId: string;
  remainingMinor: number;
};

export function AddPaymentForm({ orderId, remainingMinor }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");

  const [state, formAction] = useActionState(
    async (
      _prev: AddPaymentResult | undefined,
      formData: FormData,
    ): Promise<AddPaymentResult | undefined> => {
      return addPaymentToOrder(_prev, formData);
    },
    undefined,
  );

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  if (remainingMinor <= 0) {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-300">
        This order is fully paid.
      </p>
    );
  }

  return (
    <form action={formAction} className="grid max-w-md gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Remaining balance:{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {formatMinorAsCurrency(remainingMinor)}
        </span>
      </p>
      <div className="space-y-1">
        <Label htmlFor="amount">Amount</Label>
        <CurrencyField
          id="amount"
          name="amount"
          placeholder="0.00"
          required
          value={amount}
          onChange={setAmount}
          allowEmpty
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="method">Method</Label>
        <Input
          id="method"
          name="method"
          placeholder="Cash, card, transfer…"
          required
          defaultValue="Cash"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="paymentDate">Date</Label>
        <Input
          id="paymentDate"
          name="paymentDate"
          type="datetime-local"
          defaultValue={toLocalDatetimeValue(new Date())}
        />
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      <Button type="submit">Record payment</Button>
    </form>
  );
}

function toLocalDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}
