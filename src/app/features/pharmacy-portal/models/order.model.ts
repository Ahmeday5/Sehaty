/** Mirrors the backend `OrderStatus` enum exactly — numeric values are sent/received as-is. */
export enum OrderStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
  Preparing = 3,
  OutForDelivery = 4,
  Delivered = 5,
  Cancelled = 6,
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'قيد الانتظار',
  [OrderStatus.Accepted]: 'مقبول',
  [OrderStatus.Rejected]: 'مرفوض',
  [OrderStatus.Preparing]: 'قيد التجهيز',
  [OrderStatus.OutForDelivery]: 'خارج للتوصيل',
  [OrderStatus.Delivered]: 'تم التسليم',
  [OrderStatus.Cancelled]: 'ملغي',
};

export type StatBadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'teal' | 'purple' | 'primary' | 'default';

export const ORDER_STATUS_VARIANT: Record<OrderStatus, StatBadgeVariant> = {
  [OrderStatus.Pending]: 'amber',
  [OrderStatus.Accepted]: 'blue',
  [OrderStatus.Rejected]: 'red',
  [OrderStatus.Preparing]: 'purple',
  [OrderStatus.OutForDelivery]: 'teal',
  [OrderStatus.Delivered]: 'green',
  [OrderStatus.Cancelled]: 'default',
};

/**
 * Mirrors the backend's AllowedTransitions table exactly. Any transition not
 * listed here is rejected by the server with 400 — the UI must only ever
 * offer these so a click never results in a guaranteed-failing request.
 * Pending → Cancelled is intentionally absent: cancelling a pending order is
 * the patient's action (PatientPharmacyController.CancelOrder), not the pharmacy's.
 */
export const ORDER_ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.Pending]: [OrderStatus.Accepted, OrderStatus.Rejected],
  [OrderStatus.Accepted]: [OrderStatus.Preparing, OrderStatus.Cancelled],
  [OrderStatus.Preparing]: [OrderStatus.OutForDelivery, OrderStatus.Cancelled],
  [OrderStatus.OutForDelivery]: [OrderStatus.Delivered],
  [OrderStatus.Delivered]: [],
  [OrderStatus.Rejected]: [],
  [OrderStatus.Cancelled]: [],
};

export enum PaymentMethod {
  Cash = 0,
  Card = 1,
}

export const PAYMENT_METHOD_LABELS: Record<number, string> = {
  [PaymentMethod.Cash]: 'الدفع عند الاستلام',
  [PaymentMethod.Card]: 'بطاقة إلكترونية',
};

export interface OrderItem {
  id: number;
  itemNameAr: string;
  itemNameEn: string;
  itemCode: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  patientId: number;
  pharmacyId: number;
  pharmacyName: string | null;
  prescriptionId: number | null;
  status: OrderStatus;
  rejectionReason: string | null;
  cancellationReason: string | null;
  deliveryAddress: string;
  deliveryLat: string;
  deliveryLng: string;
  deliveryPhone: string;
  notes: string | null;
  subTotal: number;
  deliveryFee: number | null;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string | null;
  items: OrderItem[];
}

export interface OrdersListParams {
  status?: OrderStatus;
  page: number;
  pageSize: number;
}

export interface OrdersListResponse {
  total: number;
  page: number;
  pageSize: number;
  data: Order[];
}

export interface UpdateOrderStatusPayload {
  targetStatus: OrderStatus;
  deliveryFee?: number;
  rejectionReason?: string;
  cancellationReason?: string;
}
