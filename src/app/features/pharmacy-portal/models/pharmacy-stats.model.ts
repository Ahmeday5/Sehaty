export interface RevenueStats {
  total: number;
  thisMonth: number;
  lastMonth: number;
  changePercent: number;
}

export interface OrdersByStatusStats {
  pending: number;
  accepted: number;
  preparing: number;
  outForDelivery: number;
  delivered: number;
  rejected: number;
  cancelled: number;
}

export interface OrdersStats {
  todayCount: number;
  pendingActionCount: number;
  byStatus: OrdersByStatusStats;
}

export interface CatalogStats {
  totalItems: number;
  availableItems: number;
}

export interface PrescriptionsStats {
  pendingReviewCount: number;
}

export interface PharmacyMainPageStats {
  revenue: RevenueStats;
  orders: OrdersStats;
  catalog: CatalogStats;
  prescriptions: PrescriptionsStats;
}

/**
 * Visual mapping for the order-status donut — colors mirror ORDER_STATUS_VARIANT
 * in order.model.ts exactly, so "pending" reads as the same amber everywhere in
 * the app (orders table, badges, this chart).
 */
export interface OrderStatusSlice {
  key: keyof OrdersByStatusStats;
  label: string;
  color: string;
}

export const ORDER_STATUS_SLICES: OrderStatusSlice[] = [
  { key: 'pending', label: 'قيد الانتظار', color: '#F59E0B' },
  { key: 'accepted', label: 'مقبول', color: '#60A5FA' },
  { key: 'preparing', label: 'قيد التجهيز', color: '#A78BFA' },
  { key: 'outForDelivery', label: 'خارج للتوصيل', color: '#14B8A6' },
  { key: 'delivered', label: 'تم التسليم', color: '#22C55E' },
  { key: 'rejected', label: 'مرفوض', color: '#F43F5E' },
  { key: 'cancelled', label: 'ملغي', color: '#7B91B0' },
];
