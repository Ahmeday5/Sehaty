export interface ApplyDiscountPayload {
  doctorId: number;
  date: string;
  discountPercentage: number;
}

export interface DoctorOption {
  id: number;
  name: string;
  specialization: string;
}

export interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  used: number;
  maxUses: number;
  scope: string;
  expiry: string;
  active: boolean;
}

export interface AutoDiscount {
  id: number;
  emoji: string;
  title: string;
  description: string;
  value: string;
  badgeVariant: 'amber' | 'primary' | 'green';
  enabled: boolean;
}

export interface MedicalPackage {
  id: number;
  emoji: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  features: string[];
  bannerVariant: 'heart' | 'family';
}

export interface DiscountKpi {
  icon: string;
  value: string;
  label: string;
  variant: 'amber' | 'primary' | 'green' | 'red';
}

export interface CouponForm {
  code: string;
  type: 'percentage' | 'fixed';
  value: number | null;
  maxUses: number | null;
  startDate: string;
  endDate: string;
  scope: 'all' | 'doctor' | 'speciality';
}

export type DiscountTab = 'apply' | 'coupons' | 'auto' | 'packages';
