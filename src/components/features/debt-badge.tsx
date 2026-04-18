import { Badge } from "@/components/ui/badge";
import { formatMinorAsCurrency } from "@/lib/money";

export function DebtBadge({ minor }: { minor: number }) {
  if (minor <= 0) {
    return <Badge variant="success">Settled</Badge>;
  }
  return (
    <Badge variant="danger">{formatMinorAsCurrency(minor)} due</Badge>
  );
}
