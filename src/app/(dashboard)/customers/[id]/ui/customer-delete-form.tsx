"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { deleteCustomer } from "@/actions/customers";
import { Button } from "@/components/ui/button";

type Props = {
  customerId: string;
};

type DeleteState =
  | { ok?: undefined; message?: string }
  | { ok: true }
  | { ok: false; message: string };

export function CustomerDeleteForm({ customerId }: Props) {
  const router = useRouter();
  const [state, action] = useActionState(
    async (_prev: DeleteState, _formData: FormData): Promise<DeleteState> => {
      void _prev;
      void _formData;
      const res = await deleteCustomer(customerId);
      if (res.ok) {
        router.push("/customers");
        router.refresh();
        return { ok: true };
      }
      return { ok: false, message: res.message };
    },
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      {state && "ok" in state && state.ok === false ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}
      <Button type="submit" variant="destructive">
        Delete customer
      </Button>
    </form>
  );
}
