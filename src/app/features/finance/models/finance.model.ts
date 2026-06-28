export type TransactionType = 'booking' | 'pharmacy' | 'monthly_commission';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'refunded';
export type FinancePeriod = 'month' | 'total';

export interface FinanceKpiSummary {
  monthlyRevenue: number;
  platformCommission: number;
  pendingAmount: number;
  totalTransactions: number;
  revenueGrowthPercent: number;
  commissionGrowthPercent: number;
  pendingCount: number;
}

export interface DoctorRevenue {
  doctorId: number;
  doctorName: string;
  revenue: number;
  maxRevenue: number;
  widthPercent: number;
}

export interface PendingPayment {
  id: number;
  partyName: string;
  description: string;
  daysAgo: number;
  amount: number;
  urgency: 'low' | 'medium' | 'high';
}

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  partyName: string;
  patientName: string | null;
  amount: number;
  commission: number;
  status: TransactionStatus;
  date: string;
}

export interface FinanceFilter {
  source: 'all' | 'booking' | 'pharmacy' | 'commission';
  period: FinancePeriod;
  search: string;
}
