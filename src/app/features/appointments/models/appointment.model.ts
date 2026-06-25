export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: number;
  bookingNumber: string;
  patientName: string;
  doctorName: string;
  specialization: string;
  appointmentDate: string;
  appointmentTime: string;
  fees: number;
  status: AppointmentStatus;
  notes?: string;
}

export interface AppointmentFilters {
  status?: AppointmentStatus | null;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  Pending:   'قيد الانتظار',
  Confirmed: 'مؤكّد',
  Completed: 'مكتمل',
  Cancelled: 'ملغي',
};

export const APPOINTMENT_STATUS_VARIANT: Record<AppointmentStatus, string> = {
  Pending:   'amber',
  Confirmed: 'blue',
  Completed: 'teal',
  Cancelled: 'red',
};
