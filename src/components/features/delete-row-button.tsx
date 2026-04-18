"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Entity = "Customer" | "Product" | "Order";

const DESCRIPTIONS: Record<Entity, string> = {
  Customer:
    "This action cannot be undone. This will permanently delete the Customer from the database.",
  Product:
    "This action cannot be undone. This will permanently delete the Product from the database.",
  Order:
    "This action cannot be undone. This will permanently delete the Order from the database.",
};

export function DeleteRowButton({
  id,
  entity,
  deleteAction,
}: {
  id: string;
  entity: Entity;
  deleteAction: (
    id: string,
  ) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      const r = await deleteAction(id);
      if (r.ok) {
        toast.success(`${entity} successfully deleted`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(r.message ?? "Could not delete");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0 text-zinc-600 hover:text-red-600 dark:text-zinc-400"
          aria-label={`Delete ${entity}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {DESCRIPTIONS[entity]}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Deleting…" : "Confirm"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
