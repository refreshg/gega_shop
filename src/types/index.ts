export type SalesOrderStatus =
  | "PAID"
  | "PARTIALLY_PAID"
  | "CONSIGNMENT"
  | "UNPAID";

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  personalId: string;
  createdAt: Date;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  /** List price in minor currency units (e.g. tetri), null if unset */
  priceMinor: number | null;
};

export type SalesOrder = {
  id: string;
  customerId: string;
  totalAmount: number;
  status: SalesOrderStatus;
  paymentTerms: string;
  isConsignment: boolean;
  createdAt: Date;
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
};
