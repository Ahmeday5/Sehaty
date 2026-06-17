export interface Discount {
  id: number;
  code: string;
  percentage: number;
  expiryDate: string;
  isActive: boolean;
  usageCount: number;
  maxUsage: number | null;
}

export interface CreateDiscountPayload {
  code: string;
  percentage: number;
  expiryDate: string;
  maxUsage?: number;
}
