import { notFound } from "next/navigation";
import Link from "next/link";
import { AddPaymentForm } from "@/components/features/add-payment-form";
import { GoogleCredentialsMissing } from "@/components/features/google-credentials-missing";
import { OrderStatusBadge } from "@/components/features/order-status-badge";
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
import { getOrderDetail } from "@/lib/db/sales-orders";
import { hasGoogleCredentialsConfigured } from "@/lib/googleSheets";
import {
  formatMinorAsCurrency,
  lineTotalMinor,
  remainingDebtMinor,
  sumPaymentsMinor,
} from "@/lib/money";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!hasGoogleCredentialsConfigured()) {
    return <GoogleCredentialsMissing />;
  }

  const detail = await getOrderDetail(id);

  if (!detail) notFound();

  const { order, customer, lineItems, payments, productsById } = detail;

  const paid = sumPaymentsMinor(payments);
  const remaining = remainingDebtMinor(order.totalAmount, payments);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <p className="text-sm text-zinc-500">
          <Link className="hover:underline" href="/orders">
            Sales orders
          </Link>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Order detail</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {formatDate(order.createdAt)} ·{" "}
          {customer ? (
            <Link
              className="font-medium hover:underline"
              href={`/customers/${order.customerId}`}
            >
              {customer.firstName} {customer.lastName}
            </Link>
          ) : (
            <span>Unknown customer</span>
          )}
          {order.createdBy ? (
            <span className="mt-1 block text-xs text-zinc-500">
              Order created by {order.createdBy}
            </span>
          ) : null}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tabular-nums">
              {formatMinorAsCurrency(order.totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paid to date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tabular-nums">
              {formatMinorAsCurrency(paid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tabular-nums">
              {formatMinorAsCurrency(remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment terms</CardTitle>
          <CardDescription>Agreement captured at order creation.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {order.paymentTerms}
          </p>
          {order.isConsignment ? (
            <p className="mt-2 text-xs text-zinc-500">
              Marked as consignment at creation.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((li) => {
                const lt = lineTotalMinor(li.quantity, li.unitPriceMinor);
                const p = li.productId ? productsById[li.productId] : undefined;
                return (
                  <TableRow key={li.id}>
                    <TableCell className="text-zinc-600">
                      {p?.name ?? "—"}
                    </TableCell>
                    <TableCell>{li.description}</TableCell>
                    <TableCell className="tabular-nums">{li.quantity}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatMinorAsCurrency(li.unitPriceMinor)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMinorAsCurrency(lt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            Add payments updates the Payments sheet and order status (no
            spreadsheet transactions — partial writes are possible if the API
            fails mid-way).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="hidden sm:table-cell">Processed by</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-zinc-500">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap text-zinc-600">
                      <div>{formatDate(p.paymentDate)}</div>
                      {p.processedBy ? (
                        <p className="mt-0.5 text-xs text-zinc-500 sm:hidden">
                          By {p.processedBy}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell className="hidden text-sm text-zinc-600 sm:table-cell">
                      {p.processedBy || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMinorAsCurrency(p.amountPaidMinor)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div>
            <h3 className="mb-2 text-sm font-medium">Add payment</h3>
            <AddPaymentForm orderId={order.id} remainingMinor={remaining} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
