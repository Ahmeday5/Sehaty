export type ReportDataType = 'bookings' | 'revenue' | 'doctors' | 'patients' | 'prescriptions' | 'pharmacies';
export type ExportFormat   = 'excel' | 'pdf' | 'csv';

export interface ReportsKpiSummary {
  exportedCount:     number;
  scheduledCount:    number;
  lastExportLabel:   string;
  lastExportSubject: string;
  exportFormats:     number;
}

export interface QuickReport {
  id:      string;
  emoji:   string;
  label:   string;
  subtext: string;
  color:   string;
  type:    ReportDataType;
  format:  ExportFormat;
}

export interface ExportHistoryItem {
  id:      number;
  emoji:   string;
  label:   string;
  date:    string;
  records: number;
}

export interface ScheduledReport {
  id:       number;
  label:    string;
  schedule: string;
  format:   ExportFormat;
  active:   boolean;
}

export interface PreviewRow {
  [key: string]: string;
}

export interface CustomReportConfig {
  dataType:  ReportDataType;
  dateFrom:  string;
  dateTo:    string;
  fields:    string[];
  format:    ExportFormat;
}

export const REPORT_FIELDS: Record<ReportDataType, string[]> = {
  bookings:      ['رقم الحجز', 'المريض', 'الطبيب', 'التخصص', 'التاريخ', 'الوقت', 'الرسوم', 'الحالة'],
  revenue:       ['رقم المعاملة', 'الطبيب', 'المبلغ', 'النوع', 'التاريخ', 'الحالة'],
  doctors:       ['الاسم', 'التخصص', 'الهاتف', 'البريد', 'الحجوزات', 'التقييم'],
  patients:      ['الاسم', 'العمر', 'الجنس', 'الهاتف', 'آخر حجز', 'الحالة'],
  prescriptions: ['رقم الوصفة', 'المريض', 'الطبيب', 'الدواء', 'التاريخ'],
  pharmacies:    ['الصيدلية', 'الموقع', 'الطلبات', 'الإيراد', 'التقييم'],
};

export const PREVIEW_DATA: Record<ReportDataType, { headers: string[]; rows: string[][] }> = {
  bookings: {
    headers: ['رقم الحجز', 'المريض', 'الطبيب', 'التخصص', 'التاريخ'],
    rows: [
      ['BK-4821', 'كريم سعيد',   'د. أحمد منصور', 'القلب',    '21/6/2026'],
      ['BK-4820', 'سارة محمود',  'د. ليلى حسن',   'باطنية',   '21/6/2026'],
      ['BK-4819', 'منى العزيز',  'د. أحمد منصور', 'القلب',    '21/6/2026'],
    ],
  },
  revenue: {
    headers: ['رقم المعاملة', 'الطبيب', 'المبلغ', 'النوع', 'التاريخ'],
    rows: [
      ['TX-1021', 'د. أحمد منصور', '350 ج', 'حجز',      '21/6/2026'],
      ['TX-1020', 'د. ليلى حسن',   '200 ج', 'استشارة', '21/6/2026'],
      ['TX-1019', 'د. خالد رشاد',  '500 ج', 'حجز',      '20/6/2026'],
    ],
  },
  doctors: {
    headers: ['الاسم', 'التخصص', 'الحجوزات', 'التقييم'],
    rows: [
      ['د. أحمد منصور', 'القلب',    '142', '4.8'],
      ['د. ليلى حسن',   'باطنية',   '98',  '4.6'],
      ['د. خالد رشاد',  'جراحة',    '76',  '4.5'],
    ],
  },
  patients: {
    headers: ['الاسم', 'العمر', 'الجنس', 'آخر حجز'],
    rows: [
      ['كريم سعيد',  '34', 'ذكر',  '21/6/2026'],
      ['سارة محمود', '28', 'أنثى', '21/6/2026'],
      ['منى العزيز', '45', 'أنثى', '20/6/2026'],
    ],
  },
  prescriptions: {
    headers: ['رقم الوصفة', 'المريض', 'الطبيب', 'التاريخ'],
    rows: [
      ['RX-881', 'كريم سعيد',  'د. أحمد منصور', '21/6/2026'],
      ['RX-880', 'سارة محمود', 'د. ليلى حسن',   '21/6/2026'],
      ['RX-879', 'منى العزيز', 'د. خالد رشاد',  '20/6/2026'],
    ],
  },
  pharmacies: {
    headers: ['الصيدلية', 'الطلبات', 'الإيراد', 'التقييم'],
    rows: [
      ['صيدلية النيل',  '320', '12,400 ج', '4.7'],
      ['صيدلية الشفاء', '210', '8,100 ج',  '4.5'],
      ['صيدلية الأمل',  '185', '7,200 ج',  '4.4'],
    ],
  },
};
