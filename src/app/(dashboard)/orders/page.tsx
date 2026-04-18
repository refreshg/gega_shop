import Link from "next/link";
import { GoogleCredentialsMissing } from "@/components/features/google-credentials-missing";
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
import type { SalesOrderStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_VALUES: SalesOrderStatus[] = [
  "PAID",
  "PARTIALLY_PAID",
  "CONSIGNMENT",
  "UNPAID",
];

const filters: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "Unpaid", value: "UNPAID" },
  { label: "Partially paid", value: "PARTIALLY_PAID" },
  { label: "Consignment", value: "CONSIGNMENT" },
  { label: "Paid", value: "PAID" },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!hasGoogleCredentialsConfigured()) {
    return <GoogleCredentialsMissing />;
  }

  const sp = await searchParams;
  const statusParam = sp.status;
  const statusFilter =
    statusParam && STATUS_VALUES.includes(statusParam as SalesOrderStatus)
      ? (statusParam as SalesOrderStatus)
      : undefined;

  const [orders, customers, payments] = await Promise.all([
    listSalesOrdersCached(),
    listCustomersCached(),
    listPaymentsCached(),
  ]);

  const customerById = Object.fromEntries(customers.map((c) => [c.id, c]));

  let rows = orders.map((o) => {
    const ps = payments.filter((p) => p.orderId === o.id);
    return {
      ...o,
      customer: customerById[o.customerId],
      remaining: remainingDebtMinor(o.totalAmount, ps),
    };
  });

  if (statusFilter) {
    rows = rows.filter((r) => r.status === statusFilter);
  }

  rows = rows.slice(0, 200);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sales orders
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Filter by payment status. Data stored in Google Sheets (minor units).
          </p>
        </div>
        <Button asChild>
          <Link href="/orders/new">New order</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const href =
            f.value == null ? "/orders" : `/orders?status=${f.value}`;
          const active =
            (f.value == null && !statusFilter) || f.value === statusFilter;
          return (
            <Button
              key={f.label}
              asChild
              size="sm"
              variant={active ? "default" : "outline"}
            >
              <Link href={href}>{f.label}</Link>
            </Button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>{rows.length} orders in this view</CardDescription>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-500">
                    No orders match this filter.
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
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/orders/${o.id}`}>View</Link>
                      </Button>
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
