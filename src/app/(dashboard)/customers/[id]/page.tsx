import { notFound } from "next/navigation";
import Link from "next/link";
import { GoogleCredentialsMissing } from "@/components/features/google-credentials-missing";
import { DebtBadge } from "@/components/features/debt-badge";
import { OrderStatusBadge } from "@/components/features/order-status-badge";
import { Button } from "@/components/ui/button";
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
import { getCustomerById } from "@/lib/db/customers";
import {
  listPaymentsCached,
  listSalesOrdersCached,
} from "@/lib/db/sales-orders";
import { hasGoogleCredentialsConfigured } from "@/lib/googleSheets";
import { formatMinorAsCurrency, remainingDebtMinor } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { CustomerDeleteForm } from "./ui/customer-delete-form";
import { CustomerEditForm } from "./ui/customer-edit-form";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!hasGoogleCredentialsConfigured()) {
    return <GoogleCredentialsMissing />;
  }

  const customer = await getCustomerById(id);

  if (!customer) notFound();

  const [orders, payments] = await Promise.all([
    listSalesOrdersCached(),
    listPaymentsCached(),
  ]);

  const orderRows = orders
    .filter((o) => o.customerId === customer.id)
    .map((o) => ({
      ...o,
      remaining: remainingDebtMinor(
        o.totalAmount,
        payments.filter((p) => p.orderId === o.id),
      ),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const totalDebt = orderRows.reduce((s, o) => s + o.remaining, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            <Link className="hover:underline" href="/customers">
              Customers
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {customer.phone} ·{" "}
            <span className="font-mono">{customer.personalId}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DebtBadge minor={totalDebt} />
          <Button asChild variant="outline">
            <Link href="/orders/new">New order</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit customer</CardTitle>
          <CardDescription>Update contact details or personal ID.</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerEditForm customer={customer} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order history</CardTitle>
          <CardDescription>
            Aggregated outstanding debt:{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatMinorAsCurrency(totalDebt)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-zinc-500">
                    No orders for this customer yet.
                  </TableCell>
                </TableRow>
              ) : (
                orderRows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="whitespace-nowrap text-zinc-600">
                      {formatDate(o.createdAt)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatMinorAsCurrency(o.totalAmount)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatMinorAsCurrency(o.remaining)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/orders/${o.id}`}>View order</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-800 dark:text-red-200">
            Danger zone
          </CardTitle>
          <CardDescription>
            Deletion is blocked if any order for this customer still has an
            outstanding balance, or if any sales order row references this
            customer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerDeleteForm customerId={customer.id} />
        </CardContent>
      </Card>
    </div>
  );
}
