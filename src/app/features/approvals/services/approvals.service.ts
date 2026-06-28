import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CacheService } from '../../../core/services/cache.service';
import {
  ApprovalKpiSummary,
  PendingApproval,
  ApprovalHistoryItem,
} from '../models/approvals.model';

// ── Mock data (replace with ApiService calls when backend is ready) ────────────

const MOCK_KPI: ApprovalKpiSummary = {
  pendingCount:      3,
  approvedThisMonth: 47,
  rejectedThisMonth: 8,
  acceptanceRate:    85,
};

const MOCK_PENDING: PendingApproval[] = [
  {
    id:             1,
    doctorName:     'د. ياسر فريد',
    initial:        'ي',
    specialization: 'العظام',
    clinic:         'عيادات شفاء',
    degree:         'ماجستير جراحة العظام — جامعة القاهرة',
    phone:          '01012345678',
    docStatus:      'uploaded',
    submittedLabel: 'تقدّم اليوم',
  },
  {
    id:             2,
    doctorName:     'د. أمنية رشاد',
    initial:        'أ',
    specialization: 'التغذية',
    clinic:         'عيادات النور',
    degree:         'بكالوريوس علوم طبية — جامعة عين شمس',
    phone:          '01023456789',
    docStatus:      'uploaded',
    submittedLabel: 'تقدّم أمس',
  },
  {
    id:             3,
    doctorName:     'د. حمزة سلامة',
    initial:        'ح',
    specialization: 'الأسنان',
    clinic:         'عيادات الجيزة',
    degree:         'دكتوراه طب أسنان — جامعة الإسكندرية',
    phone:          '01034567890',
    docStatus:      'missing',
    submittedLabel: 'تقدّم منذ يومين',
  },
];

const MOCK_HISTORY: ApprovalHistoryItem[] = [
  { id: 1, doctorName: 'د. سارة نور',   specialization: 'الأطفال',  decision: 'approved', supervisor: 'أ. رضا منصور', date: '15 مايو 2025' },
  { id: 2, doctorName: 'د. منى عادل',   specialization: 'الجلدية',  decision: 'approved', supervisor: 'م. سلمى نور',  date: '12 مايو 2025' },
  { id: 3, doctorName: 'د. كريم أمين',  specialization: 'الجراحة',  decision: 'rejected', supervisor: 'أ. رضا منصور', date: '10 مايو 2025' },
  { id: 4, doctorName: 'د. نهى رضوان',  specialization: 'العيون',   decision: 'approved', supervisor: 'م. سلمى نور',  date: '5 مايو 2025'  },
  { id: 5, doctorName: 'د. فادي حلمي',  specialization: 'القلب',    decision: 'rejected', supervisor: 'أ. رضا منصور', date: '2 مايو 2025'  },
  { id: 6, doctorName: 'د. رانيا سعيد', specialization: 'النساء',   decision: 'approved', supervisor: 'م. سلمى نور',  date: '28 أبريل 2025'},
  { id: 7, doctorName: 'د. وليد عمر',   specialization: 'الباطنية', decision: 'approved', supervisor: 'أ. رضا منصور', date: '25 أبريل 2025'},
  { id: 8, doctorName: 'د. هالة ماهر',  specialization: 'الجلدية',  decision: 'rejected', supervisor: 'م. سلمى نور',  date: '20 أبريل 2025'},
  { id: 9, doctorName: 'د. إسلام حسن',  specialization: 'العظام',   decision: 'approved', supervisor: 'أ. رضا منصور', date: '15 أبريل 2025'},
  { id: 10,doctorName: 'د. نادية طه',   specialization: 'الأطفال',  decision: 'approved', supervisor: 'م. سلمى نور',  date: '10 أبريل 2025'},
];

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ApprovalsService {
  private readonly cache = inject(CacheService);

  getKpiSummary(): Observable<ApprovalKpiSummary> {
    // TODO: replace with this.api.get<ApprovalKpiSummary>('api/Dashboard/getApprovalsSummary')
    return of(MOCK_KPI);
  }

  getPendingApprovals(): Observable<PendingApproval[]> {
    // TODO: replace with this.api.get<PendingApproval[]>('api/Dashboard/getPendingApprovals')
    return of(MOCK_PENDING);
  }

  getApprovalHistory(): Observable<ApprovalHistoryItem[]> {
    // TODO: replace with this.api.get<ApprovalHistoryItem[]>('api/Dashboard/getApprovalHistory')
    return of(MOCK_HISTORY);
  }

  approveDoctor(id: number): Observable<string> {
    // TODO: replace with this.api.putText(`api/Dashboard/approveDoctor/${id}`, null)
    return of('تمت الموافقة على الطلب');
  }

  rejectDoctor(id: number, reason?: string): Observable<string> {
    // TODO: replace with this.api.putText(`api/Dashboard/rejectDoctor/${id}`, { reason })
    return of('تم رفض الطلب');
  }
}
