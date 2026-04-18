"use client";

import { useActionState } from "react";
import { createCustomer } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CustomerCreateForm() {
  const [state, action] = useActionState(createCustomer, {});

  return (
    <form action={action} className="grid max-w-xl gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="firstName">First name</Label>
        <Input id="firstName" name="firstName" required />
        {state.fieldErrors?.firstName ? (
          <p className="text-xs text-red-600">{state.fieldErrors.firstName}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor="lastName">Last name</Label>
        <Input id="lastName" name="lastName" required />
        {state.fieldErrors?.lastName ? (
          <p className="text-xs text-red-600">{state.fieldErrors.lastName}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" required />
        {state.fieldErrors?.phone ? (
          <p className="text-xs text-red-600">{state.fieldErrors.phone}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor="personalId">Personal ID</Label>
        <Input id="personalId" name="personalId" required />
        {state.fieldErrors?.personalId ? (
          <p className="text-xs text-red-600">{state.fieldErrors.personalId}</p>
        ) : null}
      </div>
      {state.error ? (
        <p className="md:col-span-2 text-sm text-red-600">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="md:col-span-2 text-sm text-emerald-700 dark:text-emerald-300">
          Customer saved.
        </p>
      ) : null}
      <div className="md:col-span-2">
        <Button type="submit">Save customer</Button>
      </div>
    </form>
  );
}
