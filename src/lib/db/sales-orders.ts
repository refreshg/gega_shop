import type { GoogleSpreadsheetRow } from "google-spreadsheet";
import { unstable_cache } from "next/cache";

import { listCustomersCached } from "@/lib/db/customers";
import { listProductsCached } from "@/lib/db/products";
import { getReadySpreadsheet, SHEETS } from "@/lib/db/sheet-config";
import {
  coerceDate,
  parseBool,
  parseDate,
  parseIntSafe,
  parseOrderStatus,
} from "@/lib/db/parse";
import type {
  Customer,
  OrderLineItem,
  Payment,
  Product,
  SalesOrder,
  SalesOrderStatus,
} from "@/types";

function rowToSalesOrder(row: GoogleSpreadsheetRow): SalesOrder {
  return {
    id: String(row.get("id") ?? "").trim(),
    customerId: String(row.get("customerId") ?? "").trim(),
    totalAmount: parseIntSafe(row.get("totalAmount")),
    status: parseOrderStatus(String(row.get("status") ?? "")),
    paymentTerms: String(row.get("paymentTerms") ?? ""),
    isConsignment: parseBool(row.get("isConsignment")),
    createdAt: parseDate(String(row.get("createdAt") ?? "")),
  };
}

function rowToOrderItem(row: GoogleSpreadsheetRow): OrderLineItem {
  const pid = String(row.get("productId") ?? "").trim();
  return {
    id: String(row.get("id") ?? "").trim(),
    orderId: String(row.get("orderId") ?? "").trim(),
    productId: pid === "" ? null : pid,
    quantity: Math.max(1, parseIntSafe(row.get("quantity"))),
    unitPriceMinor: parseIntSafe(row.get("unitPrice")),
    description: String(row.get("description") ?? "").trim(),
  };
}

export async function listSalesOrders(): Promise<SalesOrder[]> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.salesOrders];
  const rows = await sheet.getRows();
  return rows
    .map(rowToSalesOrder)
    .filter((o) => o.id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

const loadSalesOrdersCached = unstable_cache(
  async () => listSalesOrders(),
  ["sheet-list-sales-orders"],
  { revalidate: 30, tags: ["sheet-db"] },
);

export async function listSalesOrdersCached(): Promise<SalesOrder[]> {
  const rows = await loadSalesOrdersCached();
  return rows.map((o) => ({
    ...o,
    createdAt: coerceDate(o.createdAt),
  }));
}

export async function listOrderItems(): Promise<OrderLineItem[]> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.orderItems];
  const rows = await sheet.getRows();
  return rows.map(rowToOrderItem).filter((r) => r.id);
}

export const listOrderItemsCached = unstable_cache(
  async () => listOrderItems(),
  ["sheet-list-order-items"],
  { revalidate: 30, tags: ["sheet-db"] },
);

export async function listOrderItemsByOrderId(
  orderId: string,
): Promise<OrderLineItem[]> {
  const all = await listOrderItems();
  return all.filter((i) => i.orderId === orderId);
}

export async function getSalesOrderById(
  id: string,
): Promise<SalesOrder | null> {
  const orders = await listSalesOrders();
  return orders.find((o) => o.id === id) ?? null;
}

function rowToPayment(row: GoogleSpreadsheetRow): Payment {
  return {
    id: String(row.get("id") ?? "").trim(),
    orderId: String(row.get("orderId") ?? "").trim(),
    amountPaidMinor: parseIntSafe(row.get("amountPaid")),
    paymentDate: parseDate(String(row.get("paymentDate") ?? "")),
    method: String(row.get("method") ?? "").trim() || "Unknown",
  };
}

export async function listPayments(): Promise<Payment[]> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.payments];
  const rows = await sheet.getRows();
  return rows.map(rowToPayment).filter((p) => p.id);
}

const loadPaymentsCached = unstable_cache(
  async () => listPayments(),
  ["sheet-list-payments"],
  { revalidate: 30, tags: ["sheet-db"] },
);

export async function listPaymentsCached(): Promise<Payment[]> {
  const rows = await loadPaymentsCached();
  return rows.map((p) => ({
    ...p,
    paymentDate: coerceDate(p.paymentDate),
  }));
}

export async function listPaymentsByOrderId(orderId: string): Promise<Payment[]> {
  const all = await listPayments();
  return all
    .filter((p) => p.orderId === orderId)
    .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
}

export type OrderDetail = {
  order: SalesOrder;
  customer: Customer | null;
  lineItems: OrderLineItem[];
  payments: Payment[];
  productsById: Record<string, Product>;
};

export async function getOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const [order, customers, items, payments, products] = await Promise.all([
    getSalesOrderById(orderId),
    listCustomersCached(),
    listOrderItemsByOrderId(orderId),
    listPaymentsByOrderId(orderId),
    listProductsCached(),
  ]);

  if (!order) return null;

  const customer = customers.find((c) => c.id === order.customerId) ?? null;
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

  return {
    order,
    customer,
    lineItems: items,
    payments,
    productsById,
  };
}

/**
 * Deletes order line items and payments for this order, then the sales order row.
 */
export async function deleteSalesOrderCascade(orderId: string): Promise<void> {
  const doc = await getReadySpreadsheet();
  const itemsSheet = doc.sheetsByTitle[SHEETS.orderItems];
  const paySheet = doc.sheetsByTitle[SHEETS.payments];
  const orderSheet = doc.sheetsByTitle[SHEETS.salesOrders];

  const itemRows = await itemsSheet.getRows();
  const itemsToDelete = itemRows.filter(
    (r) => String(r.get("orderId") ?? "").trim() === orderId,
  );
  for (const row of itemsToDelete) {
    await row.delete();
  }

  const payRows = await paySheet.getRows();
  const paysToDelete = payRows.filter(
    (r) => String(r.get("orderId") ?? "").trim() === orderId,
  );
  for (const row of paysToDelete) {
    await row.delete();
  }

  const orderRows = await orderSheet.getRows();
  const orderRow = orderRows.find(
    (r) => String(r.get("id") ?? "").trim() === orderId,
  );
  if (!orderRow) throw new Error("Order not found");
  await orderRow.delete();
}

export async function updateSalesOrderStatus(
  orderId: string,
  status: SalesOrderStatus,
): Promise<void> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.salesOrders];
  const rows = await sheet.getRows();
  const row = rows.find((r) => String(r.get("id") ?? "").trim() === orderId);
  if (!row) throw new Error("Order not found");
  row.assign({ status });
  await row.save();
}

export type CreateOrderInput = {
  customerId: string;
  totalAmount: number;
  status: SalesOrderStatus;
  paymentTerms: string;
  isConsignment: boolean;
  lineItems: Array<{
    productId: string | null;
    quantity: number;
    unitPriceMinor: number;
    description: string;
  }>;
  initialPayment?: { amountMinor: number; method: string; paymentDate: Date };
};

/**
 * Writes SalesOrder first, then OrderItems, then optional Payment.
 * On failure after the order row exists, throws with a message that may indicate partial data.
 */
export async function createOrderSequential(
  input: CreateOrderInput,
): Promise<{ orderId: string }> {
  const doc = await getReadySpreadsheet();
  const orderSheet = doc.sheetsByTitle[SHEETS.salesOrders];
  const itemsSheet = doc.sheetsByTitle[SHEETS.orderItems];
  const paySheet = doc.sheetsByTitle[SHEETS.payments];

  const orderId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await orderSheet.addRow({
      id: orderId,
      customerId: input.customerId,
      totalAmount: String(input.totalAmount),
      status: input.status,
      paymentTerms: input.paymentTerms,
      createdAt,
      isConsignment: input.isConsignment ? "TRUE" : "FALSE",
    });
  } catch (e) {
    console.error(e);
    throw new Error("Failed to save sales order header to Google Sheets.");
  }

  try {
    for (const line of input.lineItems) {
      const lineId = crypto.randomUUID();
      await itemsSheet.addRow({
        id: lineId,
        orderId,
        productId: line.productId ?? "",
        quantity: String(line.quantity),
        unitPrice: String(line.unitPriceMinor),
        description: line.description,
      });
    }
  } catch (e) {
    console.error(e);
    throw new Error(
      `Sales order ${orderId} was created but line items failed to save. Check the spreadsheet and remove the orphan order row if needed.`,
    );
  }

  if (input.initialPayment && input.initialPayment.amountMinor > 0) {
    try {
      await paySheet.addRow({
        id: crypto.randomUUID(),
        orderId,
        amountPaid: String(input.initialPayment.amountMinor),
        paymentDate: input.initialPayment.paymentDate.toISOString(),
        method: input.initialPayment.method,
      });
    } catch (e) {
      console.error(e);
      throw new Error(
        `Order ${orderId} and its lines were saved, but the initial payment row failed. You can add the payment manually from the order screen.`,
      );
    }
  }

  return { orderId };
}
