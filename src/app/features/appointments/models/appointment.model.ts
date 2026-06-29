export type AppointmentStatus =
  | 'Pending'
  | 'Accepted'
  | 'Rejected'
  | 'Rescheduled'
  | 'Examined'
  | 'NoShow';

export interface AppointmentItem {
  id: string | number;
  patientName: string;
  doctorName: string;
  specialization?: string;
  date: string;
  slotStartTime?: string;
  status: AppointmentStatus;
  fees?: number;
  notes?: string;
}

export interface AppointmentStatusOption {
  value: string;
  label: string;
}

export interface AppointmentsPage {
  data: AppointmentItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AppointmentFilters {
  doctorName?: string;
  patientName?: string;
  status?: string | null;
  date?: string | null;
  page: number;
  pageSize: number;
}

export const APPOINTMENT_STATUS_VARIANT: Record<string, string> = {
  Pending:      'amber',
  Accepted:     'blue',
  Rejected:     'red',
  Rescheduled:  'purple',
  Examined:     'teal',
  NoShow:       'default',
};
