import type { SalesOrderStatus } from "@/types";

export function computeInitialStatus(params: {
  totalMinor: number;
  initialPaymentMinor: number;
  isConsignment: boolean;
}): SalesOrderStatus {
  const { totalMinor, initialPaymentMinor, isConsignment } = params;
  if (totalMinor <= 0) return "PAID";
  if (initialPaymentMinor >= totalMinor) return "PAID";
  if (isConsignment && initialPaymentMinor === 0) return "CONSIGNMENT";
  if (initialPaymentMinor === 0) return "UNPAID";
  return "PARTIALLY_PAID";
}

export function computeStatusAfterPayments(params: {
  totalMinor: number;
  paidMinor: number;
  isConsignment: boolean;
}): SalesOrderStatus {
  const { totalMinor, paidMinor, isConsignment } = params;
  if (totalMinor <= 0 || paidMinor >= totalMinor) return "PAID";
  if (paidMinor === 0 && isConsignment) return "CONSIGNMENT";
  if (paidMinor === 0) return "UNPAID";
  return "PARTIALLY_PAID";
}

export function statusLabel(s: SalesOrderStatus): string {
  const map: Record<SalesOrderStatus, string> = {
    PAID: "Paid",
    PARTIALLY_PAID: "Partially paid",
    CONSIGNMENT: "Consignment",
    UNPAID: "Unpaid",
  };
  return map[s];
}
