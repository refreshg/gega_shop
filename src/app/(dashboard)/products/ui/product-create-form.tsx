"use client";

import { useActionState } from "react";
import type { ProductFormState } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  action: (
    prev: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
};

export function ProductCreateForm({ action }: Props) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="grid max-w-xl gap-3">
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
        {state.fieldErrors?.name ? (
          <p className="text-xs text-red-600">{state.fieldErrors.name}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="price">Default price (optional)</Label>
        <Input
          id="price"
          name="price"
          inputMode="decimal"
          placeholder="0.00"
        />
        {state.fieldErrors?.price ? (
          <p className="text-xs text-red-600">{state.fieldErrors.price}</p>
        ) : null}
      </div>
      {state.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          Product saved.
        </p>
      ) : null}
      <Button type="submit">Save product</Button>
    </form>
  );
}
