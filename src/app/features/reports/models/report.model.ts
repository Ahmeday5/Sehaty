export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: number;
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  price: number;
}

export interface ReportFilters {
  fromDate?: string;
  toDate?: string;
  doctorId?: number;
  status?: AppointmentStatus;
  page?: number;
  pageSize?: number;
}

export interface AppointmentsReport {
  data: Appointment[];
  totalCount: number;
  totalRevenue: number;
}
