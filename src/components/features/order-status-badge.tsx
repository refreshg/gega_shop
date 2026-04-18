import type { SalesOrderStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/order-status";

const variantMap: Record<
  SalesOrderStatus,
  "success" | "warning" | "secondary" | "danger" | "default"
> = {
  PAID: "success",
  PARTIALLY_PAID: "warning",
  CONSIGNMENT: "secondary",
  UNPAID: "danger",
};

export function OrderStatusBadge({ status }: { status: SalesOrderStatus }) {
  return (
    <Badge variant={variantMap[status]}>{statusLabel(status)}</Badge>
  );
}
