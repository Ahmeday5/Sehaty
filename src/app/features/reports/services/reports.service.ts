import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  ReportsKpiSummary, QuickReport, ExportHistoryItem,
  ScheduledReport, CustomReportConfig, ExportFormat,
} from '../models/report.model';

const MOCK_QUICK: QuickReport[] = [
  { id: 'bookings',      emoji: '📊', label: 'تقرير الحجوزات اليومية',  subtext: 'حجوزات اليوم كاملة',       color: 'primary', type: 'bookings',      format: 'excel' },
  { id: 'revenue',       emoji: '💰', label: 'التقرير المالي الشهري',   subtext: 'إيرادات يونيو 2026',       color: 'green',   type: 'revenue',       format: 'excel' },
  { id: 'doctors',       emoji: '👨‍⚕️', label: 'قائمة الأطباء الكاملة',  subtext: 'جميع الأطباء والتفاصيل',  color: 'teal',    type: 'doctors',       format: 'excel' },
  { id: 'prescriptions', emoji: '📋', label: 'تقرير الوصفات',           subtext: 'وصفات الأسبوع الحالي',     color: 'purple',  type: 'prescriptions', format: 'csv'   },
  { id: 'pharmacies',    emoji: '🏪', label: 'أداء الصيدليات',          subtext: 'مقارنة الصيدليات شهرياً',  color: 'amber',   type: 'pharmacies',    format: 'excel' },
  { id: 'patients',      emoji: '👤', label: 'قائمة المرضى',            subtext: 'كل المرضى المسجلين',       color: 'red',     type: 'patients',      format: 'csv'   },
];

const MOCK_HISTORY: ExportHistoryItem[] = [
  { id: 1, emoji: '📊', label: 'الحجوزات — Excel',  date: '21 يونيو 2026', records: 1392 },
  { id: 2, emoji: '💰', label: 'الإيرادات — Excel', date: '21 يونيو 2026', records: 234  },
  { id: 3, emoji: '📋', label: 'الوصفات — CSV',     date: '20 يونيو 2026', records: 89   },
  { id: 4, emoji: '👨‍⚕️', label: 'الأطباء — Excel',  date: '18 يونيو 2026', records: 48   },
];

const MOCK_SCHEDULED: ScheduledReport[] = [
  { id: 1, label: 'التقرير المالي الأسبوعي',  schedule: 'كل إثنين 8 ص', format: 'excel', active: true  },
  { id: 2, label: 'تقرير الحجوزات اليومي',    schedule: 'يومياً 11 م',   format: 'pdf',   active: true  },
  { id: 3, label: 'ملخص الأطباء الشهري',       schedule: 'أول كل شهر',   format: 'excel', active: true  },
  { id: 4, label: 'تقرير الوصفات',            schedule: 'كل أسبوع',     format: 'csv',   active: false },
];

@Injectable({ providedIn: 'root' })
export class ReportsService {

  // TODO: GET /api/reports/kpi
  getKpiSummary(): Observable<ReportsKpiSummary> {
    return of({
      exportedCount:     24,
      scheduledCount:    4,
      lastExportLabel:   'آخر',
      lastExportSubject: 'تقرير مالي',
      exportFormats:     3,
    }).pipe(delay(400));
  }

  // TODO: GET /api/reports/quick-list
  getQuickReports(): Observable<QuickReport[]> {
    return of(MOCK_QUICK).pipe(delay(300));
  }

  // TODO: GET /api/reports/export-history
  getExportHistory(): Observable<ExportHistoryItem[]> {
    return of(MOCK_HISTORY).pipe(delay(350));
  }

  // TODO: GET /api/reports/scheduled
  getScheduledReports(): Observable<ScheduledReport[]> {
    return of(MOCK_SCHEDULED).pipe(delay(300));
  }

  // TODO: POST /api/reports/export  { config }
  exportReport(config: CustomReportConfig): Observable<string> {
    return of(`تم تصدير التقرير بصيغة ${config.format.toUpperCase()} بنجاح`).pipe(delay(800));
  }

  // TODO: POST /api/reports/quick-export  { type, format }
  quickExport(type: string, format: ExportFormat): Observable<string> {
    const labels: Record<string, string> = {
      bookings: 'الحجوزات', revenue: 'الإيرادات', doctors: 'الأطباء',
      prescriptions: 'الوصفات', pharmacies: 'الصيدليات', patients: 'المرضى',
    };
    return of(`تم تصدير تقرير ${labels[type] ?? type} بصيغة ${format.toUpperCase()}`).pipe(delay(600));
  }
}
