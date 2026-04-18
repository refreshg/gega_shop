import { NewOrderForm } from "@/components/features/new-order-form";
import { GoogleCredentialsMissing } from "@/components/features/google-credentials-missing";
import { listCustomersCached } from "@/lib/db/customers";
import { hasGoogleCredentialsConfigured } from "@/lib/googleSheets";
import { listProductsCached } from "@/lib/db/products";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  if (!hasGoogleCredentialsConfigured()) {
    return <GoogleCredentialsMissing />;
  }

  const [customers, products] = await Promise.all([
    listCustomersCached(),
    listProductsCached(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New sales order</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Writes to Google Sheets: SalesOrders, then OrderItems, then Payments
          (if any).
        </p>
      </div>
      <NewOrderForm customers={customers} products={products} />
    </div>
  );
}
