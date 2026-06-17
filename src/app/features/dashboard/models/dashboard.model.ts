export interface DashboardStats {
  totalProfit:       number;
  profitToday:       number;
  totalAppointments: number;
  todayAppointments: number;
  totalPatients:     number;
  todayPatients:     number;
}

export interface StatCard {
  label:     string;
  value:     number;
  icon:      string;
  color:     string;
  isCurrency?: boolean;
}
