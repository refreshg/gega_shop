import { GoogleCredentialsMissing } from "@/components/features/google-credentials-missing";
import { SheetLoadError } from "@/components/features/sheet-load-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listCustomersCached } from "@/lib/db/customers";
import { hasGoogleCredentialsConfigured } from "@/lib/googleSheets";
import { CustomerCreateForm } from "./ui/customer-create-form";
import { CustomersDirectory } from "./ui/customers-directory";

export const dynamic = "force-dynamic";

function toIsoSafe(d: Date): string {
  const t = d.getTime();
  return Number.isNaN(t) ? new Date(0).toISOString() : d.toISOString();
}

export default async function CustomersPage() {
  if (!hasGoogleCredentialsConfigured()) {
    return <GoogleCredentialsMissing />;
  }

  let customerItems;
  try {
    const customers = await listCustomersCached();
    customerItems = customers.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      phone: c.phone,
      personalId: c.personalId,
      createdAt: toIsoSafe(c.createdAt),
    }));
  } catch (e) {
    return (
      <SheetLoadError
        title="Could not load customers"
        error={e}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Stored in the Customers sheet. Personal ID must be unique.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add customer</CardTitle>
          <CardDescription>
            First name, last name, phone, and personal ID are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerCreateForm />
        </CardContent>
      </Card>

      <CustomersDirectory customers={customerItems} />
    </div>
  );
}
