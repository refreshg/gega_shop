import { GoogleCredentialsMissing } from "@/components/features/google-credentials-missing";
import { SheetLoadError } from "@/components/features/sheet-load-error";
import { requireAdmin } from "@/lib/auth/require";
import { listUsersCached } from "@/lib/db/users";
import { hasGoogleCredentialsConfigured } from "@/lib/googleSheets";
import type { ShopUser } from "@/types";

import { UsersManagement } from "./ui/users-management";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireAdmin();

  if (!hasGoogleCredentialsConfigured()) {
    return <GoogleCredentialsMissing />;
  }

  let users: ShopUser[];
  try {
    users = await listUsersCached();
  } catch (e) {
    return <SheetLoadError title="Could not load users" error={e} />;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          PINs are stored in the Users sheet. Each PIN must be unique (4 digits).
        </p>
      </div>

      <UsersManagement initialUsers={users} />
    </div>
  );
}
