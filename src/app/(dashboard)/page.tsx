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
import { listCustomersCached } from "@/lib/db/customers";
import {
  listPaymentsCached,
  listSalesOrdersCached,
} from "@/lib/db/sales-orders";
import { formatMinorAsCurrency, remainingDebtMinor } from "@/lib/money";
import { hasGoogleCredentialsConfigured } from "@/lib/googleSheets";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!hasGoogleCredentialsConfigured()) {
    return <GoogleCredentialsMissing />;
  }

  const [orders, customers, payments] = await Promise.all([
    listSalesOrdersCached(),
    listCustomersCached(),
    listPaymentsCached(),
  ]);

  const customerById = Object.fromEntries(customers.map((c) => [c.id, c]));

  const rows = orders.slice(0, 100).map((o) => {
    const ps = payments.filter((p) => p.orderId === o.id);
    const remaining = remainingDebtMinor(o.totalAmount, ps);
    return {
      ...o,
      customer: customerById[o.customerId],
      remaining,
    };
  });

  const totalOutstanding = rows.reduce((s, r) => s + r.remaining, 0);
  const unpaidCount = rows.filter(
    (r) =>
      r.remaining > 0 &&
      (r.status === "UNPAID" ||
        r.status === "PARTIALLY_PAID" ||
        r.status === "CONSIGNMENT"),
  ).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Data source: Google Sheets (cached reads).
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/customers">Customers</Link>
          </Button>
          <Button asChild>
            <Link href="/orders/new">New sales order</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total outstanding</CardTitle>
            <CardDescription>Across all open balances</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatMinorAsCurrency(totalOutstanding)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders with debt</CardTitle>
            <CardDescription>Not fully settled</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{unpaidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders tracked</CardTitle>
            <CardDescription>Latest 100 in view</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{rows.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent sales orders</CardTitle>
          <CardDescription>
            Payment status and remaining debt per order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-500">
                    No orders yet.{" "}
                    <Link className="underline" href="/orders/new">
                      Create one
                    </Link>
                    .
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="whitespace-nowrap text-zinc-600">
                      {formatDate(o.createdAt)}
                    </TableCell>
                    <TableCell>
                      {o.customer ? (
                        <Link
                          className="font-medium hover:underline"
                          href={`/customers/${o.customerId}`}
                        >
                          {o.customer.firstName} {o.customer.lastName}
                        </Link>
                      ) : (
                        <span className="text-zinc-500">Unknown customer</span>
                      )}
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
                      <div className="flex justify-end gap-2">
                        <DebtBadge minor={o.remaining} />
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/orders/${o.id}`}>View</Link>
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
    </div>
  );
}
