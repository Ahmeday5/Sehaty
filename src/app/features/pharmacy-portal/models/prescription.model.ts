import { StatBadgeVariant } from './order.model';

/** Mirrors the backend `PrescriptionStatus` enum exactly — numeric values are sent/received as-is. */
export enum PrescriptionStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
}

export const PRESCRIPTION_STATUS_LABELS: Record<PrescriptionStatus, string> = {
  [PrescriptionStatus.Pending]: 'قيد المراجعة',
  [PrescriptionStatus.Accepted]: 'مقبولة',
  [PrescriptionStatus.Rejected]: 'مرفوضة',
};

export const PRESCRIPTION_STATUS_VARIANT: Record<PrescriptionStatus, StatBadgeVariant> = {
  [PrescriptionStatus.Pending]: 'amber',
  [PrescriptionStatus.Accepted]: 'green',
  [PrescriptionStatus.Rejected]: 'red',
};

export interface Prescription {
  id: number;
  patientId: number;
  pharmacyId: number;
  pharmacyName: string | null;
  imageUrl: string;
  status: PrescriptionStatus;
  rejectionReason: string | null;
  notes: string | null;
  deliveryAddress: string;
  deliveryLat: string;
  deliveryLng: string;
  deliveryPhone: string;
  /** 0 or null means no order has been created from this prescription yet. */
  orderId: number | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface PrescriptionsListParams {
  status?: PrescriptionStatus;
  page: number;
  pageSize: number;
}

export interface PrescriptionsListResponse {
  total: number;
  page: number;
  pageSize: number;
  data: Prescription[];
}

export interface ReviewPrescriptionPayload {
  accept: boolean;
  rejectionReason?: string;
}

export interface ReviewPrescriptionResponse {
  message: string;
  status: string;
}

export interface CreateOrderFromPrescriptionItem {
  pharmacyItemId: number;
  quantity: number;
}

export interface CreateOrderFromPrescriptionPayload {
  items: CreateOrderFromPrescriptionItem[];
}

export interface CreateOrderFromPrescriptionResponse {
  message: string;
  orderId: number;
}

export interface PrescriptionReviewRequest {
  prescription: Prescription;
  accept: boolean;
  rejectionReason?: string;
}

export interface PrescriptionCreateOrderRequest {
  prescription: Prescription;
  items: CreateOrderFromPrescriptionItem[];
}
