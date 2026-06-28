import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CacheService } from '../../../core/services/cache.service';
import {
  AuditKpiSummary,
  ActiveSession,
  AuditLogEntry,
} from '../models/audit.model';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_KPI: AuditKpiSummary = {
  activeSessionsCount:  3,
  actionsToday:         247,
  failedLoginsToday:    2,
  sensitiveEditsToday:  5,
};

const MOCK_SESSIONS: ActiveSession[] = [
  {
    id: 1, adminName: 'أ. رضا منصور',  initial: 'ر',
    role: 'Super Admin', browser: 'Chrome — Windows',
    ip: '102.40.12.8', sinceLabel: 'منذ 25 دق', isCurrentUser: true,
  },
  {
    id: 2, adminName: 'م. سلمى نور',   initial: 'س',
    role: 'مشرف الأطباء', browser: 'Safari — Mac',
    ip: '102.40.12.9', sinceLabel: 'منذ ساعة', isCurrentUser: false,
  },
  {
    id: 3, adminName: 'أ. حسام غالي',  initial: 'ح',
    role: 'مشرف الصيدليات', browser: 'Firefox — Windows',
    ip: '102.40.15.3', sinceLabel: 'منذ 3 ساعات', isCurrentUser: false,
  },
];

const MOCK_LOG: AuditLogEntry[] = [
  { id:  1, adminName: 'أ. رضا منصور',  initial: 'ر', action: 'قبول طلب',             target: 'د. سارة نور',          riskLevel: 'low',    ip: '102.40.12.8', time: 'اليوم 9:05 ص'  },
  { id:  2, adminName: 'م. سلمى نور',   initial: 'س', action: 'تعديل بيانات طبيب',    target: 'د. أحمد الشرقاوي',    riskLevel: 'medium', ip: '102.40.12.9', time: 'اليوم 9:30 ص'  },
  { id:  3, adminName: 'أ. رضا منصور',  initial: 'ر', action: 'إرسال إشعار جماعي',   target: '12,847 مريض',          riskLevel: 'medium', ip: '102.40.12.8', time: 'اليوم 10:00 ص' },
  { id:  4, adminName: 'أ. حسام غالي',  initial: 'ح', action: 'تعليق صيدلية',         target: 'صيدلية الصحة',         riskLevel: 'high',   ip: '102.40.15.3', time: 'أمس 4:20 م'    },
  { id:  5, adminName: 'م. دينا رشاد',  initial: 'د', action: 'تصدير تقرير مالي',     target: 'يونيو 2026',           riskLevel: 'low',    ip: '102.40.16.1', time: 'أمس 2:00 م'    },
  { id:  6, adminName: 'أ. رضا منصور',  initial: 'ر', action: 'تسجيل دخول',           target: '—',                    riskLevel: 'low',    ip: '102.40.12.8', time: 'اليوم 8:55 ص'  },
  { id:  7, adminName: 'م. سلمى نور',   initial: 'س', action: 'رفض طلب تسجيل',        target: 'د. كريم أمين',         riskLevel: 'low',    ip: '102.40.12.9', time: 'أمس 11:00 ص'   },
  { id:  8, adminName: 'أ. حسام غالي',  initial: 'ح', action: 'حذف إعلان',            target: 'إعلان رمضان 2026',     riskLevel: 'high',   ip: '102.40.15.3', time: 'أمس 3:10 م'    },
  { id:  9, adminName: 'م. دينا رشاد',  initial: 'د', action: 'تعديل بيانات مريض',    target: 'نور الدين محمد',       riskLevel: 'medium', ip: '102.40.16.1', time: 'أمس 1:00 م'    },
  { id: 10, adminName: 'أ. رضا منصور',  initial: 'ر', action: 'تعديل أسعار الخصم',   target: 'باقة العائلة',         riskLevel: 'medium', ip: '102.40.12.8', time: 'أمس 10:30 ص'   },
  { id: 11, adminName: 'م. سلمى نور',   initial: 'س', action: 'تفعيل طبيب',           target: 'د. وليد عمر',          riskLevel: 'low',    ip: '102.40.12.9', time: '27 يونيو'       },
  { id: 12, adminName: 'أ. حسام غالي',  initial: 'ح', action: 'محاولة دخول فاشلة',   target: '—',                    riskLevel: 'high',   ip: '102.40.15.3', time: '26 يونيو'       },
];

export const ADMIN_NAMES = [
  'أ. رضا منصور',
  'م. سلمى نور',
  'أ. حسام غالي',
  'م. دينا رشاد',
];

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly cache = inject(CacheService);

  getKpiSummary(): Observable<AuditKpiSummary> {
    // TODO: replace with this.api.get<AuditKpiSummary>('api/Dashboard/getAuditSummary')
    return of(MOCK_KPI);
  }

  getActiveSessions(): Observable<ActiveSession[]> {
    // TODO: replace with this.api.get<ActiveSession[]>('api/Dashboard/getActiveSessions')
    return of(MOCK_SESSIONS);
  }

  getAuditLog(): Observable<AuditLogEntry[]> {
    // TODO: replace with this.api.get<AuditLogEntry[]>('api/Dashboard/getAuditLog')
    return of(MOCK_LOG);
  }

  terminateSession(sessionId: number): Observable<string> {
    // TODO: replace with this.api.deleteText(`api/Dashboard/terminateSession/${sessionId}`)
    return of('تم إنهاء الجلسة');
  }
}
