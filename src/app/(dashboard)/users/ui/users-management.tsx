"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState, useTransition } from "react";

import {
  createUserAction,
  deleteUserAction,
  updateUserAction,
  type UserFormState,
} from "@/actions/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ShopUser } from "@/types";

function UserFields({
  idPrefix,
  defaultName = "",
  defaultPin = "",
  defaultRole = "staff" as ShopUser["role"],
}: {
  idPrefix: string;
  defaultName?: string;
  defaultPin?: string;
  defaultRole?: ShopUser["role"];
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          defaultValue={defaultName}
          autoComplete="name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-pin`}>PIN (4 digits)</Label>
        <Input
          id={`${idPrefix}-pin`}
          name="pin"
          type="password"
          inputMode="numeric"
          maxLength={4}
          pattern="\d{4}"
          defaultValue={defaultPin}
          className="font-mono tracking-widest"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-role`}>Role</Label>
        <select
          id={`${idPrefix}-role`}
          name="role"
          defaultValue={defaultRole}
          className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
        >
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </>
  );
}

function AddUserForm({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createUserAction,
    {} as UserFormState,
  );

  useEffect(() => {
    if (state.success) onCreated();
  }, [state.success, onCreated]);

  return (
    <form action={formAction} className="space-y-4">
      <UserFields idPrefix="add" />
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.fieldErrors?.name ? (
        <p className="text-sm text-red-600">{state.fieldErrors.name}</p>
      ) : null}
      {state.fieldErrors?.pin ? (
        <p className="text-sm text-red-600">{state.fieldErrors.pin}</p>
      ) : null}
      {state.fieldErrors?.role ? (
        <p className="text-sm text-red-600">{state.fieldErrors.role}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add user"}
      </Button>
    </form>
  );
}

function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSaved,
}: {
  user: ShopUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateUserAction.bind(null, user.id),
    {} as UserFormState,
  );

  useEffect(() => {
    if (state.success) {
      onSaved();
      onOpenChange(false);
    }
  }, [state.success, onSaved, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <UserFields
            idPrefix="edit"
            defaultName={user.name}
            defaultPin={user.pin}
            defaultRole={user.role}
          />
          {state.error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.fieldErrors?.name ? (
            <p className="text-sm text-red-600">{state.fieldErrors.name}</p>
          ) : null}
          {state.fieldErrors?.pin ? (
            <p className="text-sm text-red-600">{state.fieldErrors.pin}</p>
          ) : null}
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersManagement({
  initialUsers,
}: {
  initialUsers: ShopUser[];
}) {
  const router = useRouter();
  const [editUser, setEditUser] = useState<ShopUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addFormKey, setAddFormKey] = useState(0);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const onUserCreated = useCallback(() => {
    setAddFormKey((k) => k + 1);
    refresh();
  }, [refresh]);

  const handleDelete = (u: ShopUser) => {
    if (
      !window.confirm(
        `Delete user "${u.name}"? They will no longer be able to sign in.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const r = await deleteUserAction(u.id);
      if (!r.ok) {
        window.alert(r.message);
        return;
      }
      refresh();
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add user</CardTitle>
          <CardDescription>
            New users can sign in immediately with their PIN.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddUserForm key={addFormKey} onCreated={onUserCreated} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>{initialUsers.length} accounts</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-zinc-500">
                    No users yet. Add the first account above, or seed the Users
                    sheet manually.
                  </TableCell>
                </TableRow>
              ) : (
                initialUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="capitalize">{u.role}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditUser(u);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={pending}
                          onClick={() => handleDelete(u)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editUser ? (
        <EditUserDialog
          key={editUser.id}
          user={editUser}
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o) setEditUser(null);
          }}
          onSaved={refresh}
        />
      ) : null}
    </>
  );
}
