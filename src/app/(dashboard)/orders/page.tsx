import Link from "next/link";
import { GoogleCredentialsMissing } from "@/components/features/google-credentials-missing";
import { SheetLoadError } from "@/components/features/sheet-load-error";
import { Button } from "@/components/ui/button";
import { listCustomersCached } from "@/lib/db/customers";
import { listProductsCached } from "@/lib/db/products";
import {
  listOrderItemsCached,
  listPaymentsCached,
  listSalesOrdersCached,
} from "@/lib/db/sales-orders";
import { remainingDebtMinor } from "@/lib/money";
import { statusLabel } from "@/lib/order-status";
import { hasGoogleCredentialsConfigured } from "@/lib/googleSheets";
import type { SalesOrderStatus } from "@/types";

import { OrdersDirectory } from "./ui/orders-directory";

export const dynamic = "force-dynamic";

const STATUS_VALUES: SalesOrderStatus[] = [
  "PAID",
  "PARTIALLY_PAID",
  "CONSIGNMENT",
  "UNPAID",
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
  const initialStatusFilter =
    statusParam && STATUS_VALUES.includes(statusParam as SalesOrderStatus)
      ? (statusParam as SalesOrderStatus)
      : null;

  let rows;
  try {
    const [orders, customers, payments, orderItems, products] =
      await Promise.all([
        listSalesOrdersCached(),
        listCustomersCached(),
        listPaymentsCached(),
        listOrderItemsCached(),
        listProductsCached(),
      ]);

    const customerById = Object.fromEntries(customers.map((c) => [c.id, c]));
    const productById = Object.fromEntries(products.map((p) => [p.id, p]));

    const itemsByOrderId = new Map<string, typeof orderItems>();
    for (const item of orderItems) {
      const list = itemsByOrderId.get(item.orderId);
      if (list) list.push(item);
      else itemsByOrderId.set(item.orderId, [item]);
    }

    rows = orders.map((o) => {
      const ps = payments.filter((p) => p.orderId === o.id);
      const remaining = remainingDebtMinor(o.totalAmount, ps);
      const cust = customerById[o.customerId];
      const items = itemsByOrderId.get(o.id) ?? [];
      const productParts: string[] = [];
      for (const li of items) {
        if (li.productId && productById[li.productId]) {
          productParts.push(productById[li.productId].name);
        }
        if (li.description) productParts.push(li.description);
      }
      const searchBlob = [
        o.id,
        o.status,
        statusLabel(o.status),
        cust?.firstName ?? "",
        cust?.lastName ?? "",
        cust ? `${cust.firstName} ${cust.lastName}` : "",
        ...productParts,
        o.isConsignment ? "consignment" : "",
      ]
        .join(" ")
        .toLowerCase();

      const t = o.createdAt.getTime();
      const createdAtIso = Number.isNaN(t)
        ? new Date(0).toISOString()
        : o.createdAt.toISOString();

      return {
        id: o.id,
        createdAt: createdAtIso,
        status: o.status,
        totalAmount: o.totalAmount,
        remaining,
        customerId: o.customerId,
        customerFirstName: cust?.firstName ?? "",
        customerLastName: cust?.lastName ?? "",
        searchBlob,
        createdBy: o.createdBy,
      };
    });
  } catch (e) {
    return (
      <SheetLoadError
        title="Could not load sales orders"
        error={e}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sales orders
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Filter by payment status and search across customers, order IDs,
            status, and line items. Data from Google Sheets (minor units).
          </p>
        </div>
        <Button asChild>
          <Link href="/orders/new">New order</Link>
        </Button>
      </div>

      <OrdersDirectory
        key={initialStatusFilter ?? "all"}
        rows={rows}
        initialStatusFilter={initialStatusFilter}
      />
    </div>
  );
}
