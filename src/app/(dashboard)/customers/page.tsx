import { GoogleCredentialsMissing } from "@/components/features/google-credentials-missing";
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

export default async function CustomersPage() {
  if (!hasGoogleCredentialsConfigured()) {
    return <GoogleCredentialsMissing />;
  }

  const customers = await listCustomersCached();
  const customerItems = customers.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    personalId: c.personalId,
    createdAt: c.createdAt.toISOString(),
  }));

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
