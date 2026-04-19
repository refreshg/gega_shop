import { getReadySpreadsheet, SHEETS } from "@/lib/db/sheet-config";
import {
  getSalesOrderById,
  listPayments,
  updateSalesOrderStatus,
} from "@/lib/db/sales-orders";
import { formatMinorToDisplay, sumPaymentsMinor } from "@/lib/money";
import { computeStatusAfterPayments } from "@/lib/order-status";

export async function appendPayment(input: {
  orderId: string;
  amountPaidMinor: number;
  method: string;
  paymentDate: Date;
  processedBy: string;
}): Promise<void> {
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.payments];
  await sheet.addRow({
    id: crypto.randomUUID(),
    orderId: input.orderId,
    amountPaid: formatMinorToDisplay(input.amountPaidMinor),
    paymentDate: input.paymentDate.toISOString(),
    method: input.method,
    processedBy: input.processedBy,
  });
}

/**
 * Loads order and payments from Sheets, validates remaining balance, appends payment, updates order status.
 */
export async function addPaymentAndUpdateStatus(input: {
  orderId: string;
  amountPaidMinor: number;
  method: string;
  paymentDate: Date;
  processedBy: string;
}): Promise<void> {
  const order = await getSalesOrderById(input.orderId);
  if (!order) throw new Error("Order not found");

  const payments = (await listPayments()).filter(
    (p) => p.orderId === input.orderId,
  );
  const paid = sumPaymentsMinor(payments);
  const remaining = order.totalAmount - paid;
  if (input.amountPaidMinor > remaining) {
    throw new Error(
      `Payment exceeds remaining balance (${(remaining / 100).toFixed(2)}).`,
    );
  }

  await appendPayment({
    orderId: input.orderId,
    amountPaidMinor: input.amountPaidMinor,
    method: input.method,
    paymentDate: input.paymentDate,
    processedBy: input.processedBy,
  });
  // Convert legacy minor-unit payment rows to readable decimals as we touch them.
  const doc = await getReadySpreadsheet();
  const sheet = doc.sheetsByTitle[SHEETS.payments];
  const payRows = await sheet.getRows();
  const toFix = payRows.filter(
    (r) => String(r.get("orderId") ?? "").trim() === input.orderId,
  );
  for (const r of toFix) {
    const cur = r.get("amountPaid");
    const s = String(cur ?? "").trim();
    if (!s) continue;
    // If no decimal separator, assume legacy minor units and rewrite.
    if (!/[.,]\d{1,2}\s*$/.test(s)) {
      const minor = Number.parseInt(s.replace(/,/g, ""), 10);
      if (!Number.isNaN(minor)) {
        r.assign({ amountPaid: formatMinorToDisplay(minor) });
        await r.save();
      }
    }
  }

  const newPaid = paid + input.amountPaidMinor;
  const status = computeStatusAfterPayments({
    totalMinor: order.totalAmount,
    paidMinor: newPaid,
    isConsignment: order.isConsignment,
  });
  await updateSalesOrderStatus(input.orderId, status);
}
