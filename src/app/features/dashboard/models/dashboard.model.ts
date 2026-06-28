// ── GET /api/Dashboard/getMainPageStats ──────────────────────────────────────

export interface MainPageStatsResponse {
  revenue: {
    total:         number;
    changePercent: number;
  };
  todayAppointments: {
    count:          number;
    attendanceRate: number;
  };
  activeDoctors: {
    count: number;
  };
  patients: {
    total:              number;
    newThisMonthCount:  number;
    newThisMonthPercent: number;
  };
}

// ── GET /api/dashboard/getRevenueChart?type=monthly|weekly&count=8 ───────────

export type RevenueChartType = 'monthly' | 'weekly';

export interface RevenueChartPoint {
  label:   string;
  revenue: number;
}

export interface RevenueChartResponse {
  type: RevenueChartType;
  data: RevenueChartPoint[];
}

// ── GET /api/Dashboard/getSpecialtyDistribution ───────────────────────────────

export interface SpecialtyDistributionItem {
  specialization: string;
  count:          number;
  percentage:     number;
}

export interface SpecialtyDistributionResponse {
  total: number;
  data:  SpecialtyDistributionItem[];
}

// ── GET /api/Dashboard/getLatestAppointments?count=10 ────────────────────────

export type AppointmentStatus =
  | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rejected';

export interface LatestAppointmentItem {
  id:            string;
  patientName:   string;
  doctorName:    string;
  date:          string;
  slotStartTime: string;
  status:        AppointmentStatus;
}

export interface LatestAppointmentsResponse {
  data: LatestAppointmentItem[];
}

// ── GET /api/Dashboard/getActivityLog?hours=24&count=20 ──────────────────────

export type ActivityRecipientType =
  | 'Doctor' | 'Patient' | 'Admin' | 'System' | 'Pharmacy';

export interface ActivityLogItem {
  id:            number;
  title:         string;
  description:   string;
  recipientType: ActivityRecipientType;
  createdAt:     string;
}

export interface ActivityLogResponse {
  since: string;
  data:  ActivityLogItem[];
}

// ── Legacy shape kept for backward-compat with existing buildCards() ──────────

export interface DashboardStats {
  totalProfit:       number;
  profitToday:       number;
  totalAppointments: number;
  todayAppointments: number;
  totalPatients:     number;
  todayPatients:     number;
}

export interface StatCard {
  label:      string;
  value:      number;
  icon:       string;
  color:      string;
  isCurrency?: boolean;
}
