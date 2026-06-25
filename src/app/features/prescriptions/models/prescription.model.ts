export type PrescriptionStatus = 'New' | 'Dispensed' | 'Rejected';
export type PrescriptionSource = 'App' | 'Doctor';

export interface Prescription {
  id: number;
  prescriptionNumber: string;
  patientName: string;
  doctorName: string;
  medications: string;
  pharmacyName: string;
  source: PrescriptionSource;
  status: PrescriptionStatus;
  createdAt: string;
  notes?: string;
}

export const PRESCRIPTION_STATUS_LABEL: Record<PrescriptionStatus, string> = {
  New:       'قيد الانتظار',
  Dispensed: 'صُرفت',
  Rejected:  'مرفوضة',
};

export const PRESCRIPTION_STATUS_VARIANT: Record<PrescriptionStatus, string> = {
  New:       'amber',
  Dispensed: 'teal',
  Rejected:  'red',
};

export const PRESCRIPTION_SOURCE_LABEL: Record<PrescriptionSource, string> = {
  App:    'التطبيق',
  Doctor: 'الطبيب',
};

export const PRESCRIPTION_SOURCE_VARIANT: Record<PrescriptionSource, string> = {
  App:    'purple',
  Doctor: 'blue',
};
