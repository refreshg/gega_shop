"use client";

import type { Customer } from "@/types";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { updateCustomer, type CustomerFormState } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  customer: Customer;
};

export function CustomerEditForm({ customer }: Props) {
  const router = useRouter();
  const [state, action] = useActionState(
    async (prev: CustomerFormState, formData: FormData) => {
      return updateCustomer(customer.id, prev, formData);
    },
    {},
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={action} className="grid max-w-xl gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="firstName">First name</Label>
        <Input
          id="firstName"
          name="firstName"
          required
          defaultValue={customer.firstName}
        />
        {state.fieldErrors?.firstName ? (
          <p className="text-xs text-red-600">{state.fieldErrors.firstName}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor="lastName">Last name</Label>
        <Input
          id="lastName"
          name="lastName"
          required
          defaultValue={customer.lastName}
        />
        {state.fieldErrors?.lastName ? (
          <p className="text-xs text-red-600">{state.fieldErrors.lastName}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          required
          defaultValue={customer.phone}
        />
        {state.fieldErrors?.phone ? (
          <p className="text-xs text-red-600">{state.fieldErrors.phone}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor="personalId">Personal ID</Label>
        <Input
          id="personalId"
          name="personalId"
          required
          defaultValue={customer.personalId}
        />
        {state.fieldErrors?.personalId ? (
          <p className="text-xs text-red-600">{state.fieldErrors.personalId}</p>
        ) : null}
      </div>
      {state.error ? (
        <p className="md:col-span-2 text-sm text-red-600">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="md:col-span-2 text-sm text-emerald-700 dark:text-emerald-300">
          Saved.
        </p>
      ) : null}
      <div className="md:col-span-2">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}
