import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CacheService } from '../../../core/services/cache.service';
import {
  FinanceKpiSummary,
  DoctorRevenue,
  PendingPayment,
  FinanceTransaction,
  FinancePeriod,
} from '../models/finance.model';

// ── Mock data (replace with ApiService calls when backend is ready) ────────────

const MOCK_KPI: FinanceKpiSummary = {
  monthlyRevenue: 487200,
  platformCommission: 48720,
  pendingAmount: 12400,
  totalTransactions: 5840,
  revenueGrowthPercent: 18.3,
  commissionGrowthPercent: 18.3,
  pendingCount: 3,
};

const MOCK_DOCTORS_MONTH: DoctorRevenue[] = [
  { doctorId: 1, doctorName: 'د. سارة نور',       revenue: 22600, maxRevenue: 22600, widthPercent: 100 },
  { doctorId: 2, doctorName: 'د. أحمد الشرقاوي',  revenue: 18400, maxRevenue: 22600, widthPercent: 81  },
  { doctorId: 3, doctorName: 'د. منى عادل',        revenue: 16800, maxRevenue: 22600, widthPercent: 74  },
  { doctorId: 4, doctorName: 'د. ليلى حسّان',      revenue: 14200, maxRevenue: 22600, widthPercent: 63  },
  { doctorId: 5, doctorName: 'د. عمر الخطيب',      revenue: 11200, maxRevenue: 22600, widthPercent: 50  },
];

const MOCK_DOCTORS_TOTAL: DoctorRevenue[] = [
  { doctorId: 1, doctorName: 'د. أحمد الشرقاوي',  revenue: 184000, maxRevenue: 210000, widthPercent: 88 },
  { doctorId: 2, doctorName: 'د. سارة نور',        revenue: 210000, maxRevenue: 210000, widthPercent: 100 },
  { doctorId: 3, doctorName: 'د. منى عادل',        revenue: 152000, maxRevenue: 210000, widthPercent: 72  },
  { doctorId: 4, doctorName: 'د. عمر الخطيب',      revenue: 128000, maxRevenue: 210000, widthPercent: 61  },
  { doctorId: 5, doctorName: 'د. ليلى حسّان',      revenue: 109000, maxRevenue: 210000, widthPercent: 52  },
];

const MOCK_PENDING: PendingPayment[] = [
  {
    id: 1,
    partyName: 'د. ياسر فريد',
    description: 'حجوزات الأسبوع الماضي',
    daysAgo: 3,
    amount: 840,
    urgency: 'low',
  },
  {
    id: 2,
    partyName: 'صيدلية الصحة',
    description: 'وصفات مارس — معلّقة',
    daysAgo: 12,
    amount: 4200,
    urgency: 'medium',
  },
  {
    id: 3,
    partyName: 'د. رانيا سعيد',
    description: 'مستحقات أبريل ومايو',
    daysAgo: 21,
    amount: 7360,
    urgency: 'high',
  },
];

const MOCK_TRANSACTIONS: FinanceTransaction[] = [
  { id: 'TXN-8841', type: 'booking',            partyName: 'د. أحمد الشرقاوي', patientName: 'كريم سعيد',   amount: 300,  commission: 30,   status: 'completed', date: 'اليوم 10:30 ص' },
  { id: 'TXN-8840', type: 'booking',            partyName: 'د. ليلى حسّان',     patientName: 'سارة محمود',  amount: 250,  commission: 25,   status: 'completed', date: 'اليوم 9:00 ص'  },
  { id: 'TXN-8839', type: 'pharmacy',           partyName: 'صيدلية النور',       patientName: 'منى العزيز',  amount: 180,  commission: 18,   status: 'pending',   date: 'اليوم 3:00 م'  },
  { id: 'TXN-8838', type: 'booking',            partyName: 'د. سارة نور',        patientName: 'محمد السيد',  amount: 200,  commission: 20,   status: 'completed', date: 'اليوم 8:30 ص'  },
  { id: 'TXN-8837', type: 'booking',            partyName: 'د. منى عادل',        patientName: 'يوسف حمدي',   amount: 280,  commission: 28,   status: 'pending',   date: 'اليوم 2:00 م'  },
  { id: 'TXN-8836', type: 'monthly_commission', partyName: 'د. أحمد الشرقاوي', patientName: null,           amount: 1840, commission: 1840, status: 'completed', date: '1 يونيو'       },
  { id: 'TXN-8835', type: 'pharmacy',           partyName: 'صيدلية العافية',     patientName: 'خالد مصطفى',  amount: 220,  commission: 22,   status: 'completed', date: 'أمس'           },
  { id: 'TXN-8834', type: 'booking',            partyName: 'د. عمر الخطيب',      patientName: 'هالة يوسف',   amount: 320,  commission: 32,   status: 'completed', date: 'أمس'           },
  { id: 'TXN-8833', type: 'pharmacy',           partyName: 'صيدلية الحياة',      patientName: 'أحمد فاروق',  amount: 150,  commission: 15,   status: 'failed',    date: 'أمس'           },
  { id: 'TXN-8832', type: 'booking',            partyName: 'د. ليلى حسّان',     patientName: 'نور الدين',   amount: 250,  commission: 25,   status: 'completed', date: '27 يونيو'      },
  { id: 'TXN-8831', type: 'monthly_commission', partyName: 'د. سارة نور',        patientName: null,           amount: 2260, commission: 2260, status: 'completed', date: '1 يونيو'       },
  { id: 'TXN-8830', type: 'booking',            partyName: 'د. منى عادل',        patientName: 'سلمى حسين',   amount: 280,  commission: 28,   status: 'refunded',  date: '26 يونيو'      },
];

const CACHE_KEY    = 'finance:summary';
const CACHE_TTL_MS = 5 * 60 * 1000;

// ── Service ─────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly cache = inject(CacheService);

  getKpiSummary(): Observable<FinanceKpiSummary> {
    // TODO: replace with this.api.get<FinanceKpiSummary>('api/Dashboard/getFinanceSummary')
    return of(MOCK_KPI);
  }

  getTopDoctorsByRevenue(period: FinancePeriod): Observable<DoctorRevenue[]> {
    // TODO: replace with this.api.get<DoctorRevenue[]>('api/Dashboard/getTopDoctorsRevenue', { params: { period } })
    return of(period === 'month' ? MOCK_DOCTORS_MONTH : MOCK_DOCTORS_TOTAL);
  }

  getPendingPayments(): Observable<PendingPayment[]> {
    // TODO: replace with this.api.get<PendingPayment[]>('api/Dashboard/getPendingPayments')
    return of(MOCK_PENDING);
  }

  getTransactions(): Observable<FinanceTransaction[]> {
    // TODO: replace with this.api.get<FinanceTransaction[]>('api/Dashboard/getFinanceTransactions')
    return of(MOCK_TRANSACTIONS);
  }

  settlePayment(id: number): Observable<string> {
    // TODO: replace with this.api.putText(`api/Dashboard/settlePayment/${id}`, null)
    return of('تم التسوية بنجاح');
  }

  settleAll(): Observable<string> {
    // TODO: replace with this.api.putText('api/Dashboard/settleAllPayments', null)
    return of('تم تسوية جميع المدفوعات');
  }
}
