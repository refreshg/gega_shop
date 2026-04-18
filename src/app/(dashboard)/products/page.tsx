import { createProduct } from "@/actions/products";
import { GoogleCredentialsMissing } from "@/components/features/google-credentials-missing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listProductsCached } from "@/lib/db/products";
import { hasGoogleCredentialsConfigured } from "@/lib/googleSheets";
import { formatMinorAsCurrency } from "@/lib/money";
import { ProductCreateForm } from "./ui/product-create-form";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  if (!hasGoogleCredentialsConfigured()) {
    return <GoogleCredentialsMissing />;
  }

  const products = await listProductsCached();

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

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
          <CardDescription>{products.length} products</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Default price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-zinc-500">
                    No products yet.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-zinc-600">
                      {p.description ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {p.priceMinor != null
                        ? formatMinorAsCurrency(p.priceMinor)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
