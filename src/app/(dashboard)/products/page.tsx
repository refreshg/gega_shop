import { createProduct } from "@/actions/products";
import { GoogleCredentialsMissing } from "@/components/features/google-credentials-missing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listProductsCached } from "@/lib/db/products";
import { hasGoogleCredentialsConfigured } from "@/lib/googleSheets";
import { ProductCreateForm } from "./ui/product-create-form";
import { ProductsCatalog } from "./ui/products-catalog";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  if (!hasGoogleCredentialsConfigured()) {
    return <GoogleCredentialsMissing />;
  }

  const products = await listProductsCached();
  const productItems = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    priceMinor: p.priceMinor,
  }));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Catalog tab in Google Sheets. Prices stored as minor units.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add product</CardTitle>
          <CardDescription>
            Used when building sales orders (you can still override per order).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductCreateForm action={createProduct} />
        </CardContent>
      </Card>

      <ProductsCatalog products={productItems} />
    </div>
  );
}
