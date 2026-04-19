export type SalesOrderStatus =
  | "PAID"
  | "PARTIALLY_PAID"
  | "CONSIGNMENT"
  | "UNPAID";

export type ShopUserRole = "admin" | "staff";

export type ShopUser = {
  id: string;
  name: string;
  pin: string;
  role: ShopUserRole;
};

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  personalId: string;
  createdAt: Date;
  createdBy: string;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  /** List price in minor currency units (e.g. tetri), null if unset */
  priceMinor: number | null;
  /** Units on hand (optional catalog field) */
  stock: number;
  createdBy: string;
};

export type SalesOrder = {
  id: string;
  customerId: string;
  totalAmount: number;
  status: SalesOrderStatus;
  paymentTerms: string;
  isConsignment: boolean;
  createdAt: Date;
  createdBy: string;
};

export type OrderLineItem = {
  id: string;
  orderId: string;
  productId: string | null;
  quantity: number;
  unitPriceMinor: number;
  description: string;
};

export type Payment = {
  id: string;
  orderId: string;
  amountPaidMinor: number;
  paymentDate: Date;
  method: string;
  processedBy: string;
};
