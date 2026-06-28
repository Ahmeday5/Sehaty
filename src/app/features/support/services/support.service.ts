import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CacheService } from '../../../core/services/cache.service';
import {
  SupportKpiSummary,
  SupportTicket,
  TicketDetail,
} from '../models/support.model';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_KPI: SupportKpiSummary = {
  urgentCount:       2,
  openCount:         5,
  inProgressCount:   12,
  resolvedThisMonth: 148,
};

const MOCK_TICKETS: SupportTicket[] = [
  {
    id:        1,
    title:     'مشكلة في دفع الحجز',
    partyName: 'كريم سعيد',
    partyType: 'patient',
    preview:   'حاولت الدفع مرتين ولم ينجح وتم خصم المبلغ من البطاقة...',
    priority:  'urgent',
    status:    'open',
    timeAgo:   'منذ 10 دق',
  },
  {
    id:        2,
    title:     'مواعيدي لا تظهر للمرضى',
    partyName: 'د. أحمد الشرقاوي',
    partyType: 'doctor',
    preview:   'المرضى يخبرونني أن جدولي فارغ رغم أنني أضفت المواعيد...',
    priority:  'urgent',
    status:    'open',
    timeAgo:   'منذ 45 دق',
  },
  {
    id:        3,
    title:     'وصفات لا تصل من التطبيق',
    partyName: 'صيدلية النور',
    partyType: 'pharmacy',
    preview:   'منذ أمس الساعة 6م لا نتلقى أي وصفات جديدة من التطبيق...',
    priority:  'normal',
    status:    'in_progress',
    timeAgo:   'منذ 2 ساعة',
  },
  {
    id:        4,
    title:     'لا أستطيع تغيير موعدي',
    partyName: 'منى العزيز',
    partyType: 'patient',
    preview:   'أحتاج تغيير موعد الثلاثاء وزر التعديل لا يعمل معي...',
    priority:  'low',
    status:    'open',
    timeAgo:   'منذ 3 ساعات',
  },
  {
    id:        5,
    title:     'تقرير الإيرادات خاطئ',
    partyName: 'د. منى عادل',
    partyType: 'doctor',
    preview:   'الأرقام لا تتطابق مع ما توصلت إليه في حساباتي الشهرية...',
    priority:  'normal',
    status:    'in_progress',
    timeAgo:   'أمس',
  },
  {
    id:        6,
    title:     'صعوبة في رفع صورة الملف الشخصي',
    partyName: 'د. ليلى حسّان',
    partyType: 'doctor',
    preview:   'كل ما أحاول رفع صورة تظهر رسالة خطأ غير واضحة...',
    priority:  'low',
    status:    'open',
    timeAgo:   'أمس',
  },
  {
    id:        7,
    title:     'الدواء لا يظهر في قاعدة البيانات',
    partyName: 'صيدلية العافية',
    partyType: 'pharmacy',
    preview:   'دواء باراسيتامول 500mg غير موجود في قائمة الأدوية...',
    priority:  'normal',
    status:    'open',
    timeAgo:   'منذ يومين',
  },
];

const MOCK_DETAILS: Record<number, TicketDetail> = {
  1: {
    ...MOCK_TICKETS[0],
    createdAt: 'اليوم 10:20 ص',
    messages: [
      { id: 1, sender: 'كريم سعيد',    senderType: 'user',    body: 'مرحباً، حاولت الدفع مرتين ولم ينجح وتم خصم المبلغ من البطاقة. أرجو المساعدة.',         time: '10:20 ص' },
      { id: 2, sender: 'فريق الدعم',   senderType: 'support', body: 'مرحباً كريم، نأسف لهذه المشكلة. هل يمكنك إرسال لقطة شاشة للخطأ الذي يظهر لك؟',      time: '10:28 ص' },
      { id: 3, sender: 'كريم سعيد',    senderType: 'user',    body: 'نعم، سأرسل الصورة الآن. رقم المعاملة هو TXN-8801.',                                     time: '10:31 ص' },
    ],
  },
  2: {
    ...MOCK_TICKETS[1],
    createdAt: 'اليوم 9:45 ص',
    messages: [
      { id: 1, sender: 'د. أحمد الشرقاوي', senderType: 'user',    body: 'المرضى يخبرونني أن جدولي فارغ رغم أنني أضفت المواعيد منذ أسبوع.', time: '9:45 ص' },
      { id: 2, sender: 'فريق الدعم',        senderType: 'support', body: 'شكراً للإبلاغ. سنتحقق من إعدادات الجدول الخاص بحسابك الآن.',    time: '9:52 ص' },
    ],
  },
  3: {
    ...MOCK_TICKETS[2],
    createdAt: 'أمس 6:00 م',
    messages: [
      { id: 1, sender: 'صيدلية النور', senderType: 'user',    body: 'منذ أمس الساعة 6م لا نتلقى أي وصفات جديدة من التطبيق.', time: 'أمس 6:00 م' },
      { id: 2, sender: 'فريق الدعم',   senderType: 'support', body: 'يبدو أن هناك مشكلة في خدمة الإشعارات. نحن نعمل على حلها.', time: 'أمس 7:15 م' },
      { id: 3, sender: 'صيدلية النور', senderType: 'user',    body: 'شكراً. هل لدى فكرة عن مدة الحل؟',                         time: 'أمس 7:30 م' },
    ],
  },
  4: {
    ...MOCK_TICKETS[3],
    createdAt: 'اليوم 7:30 ص',
    messages: [
      { id: 1, sender: 'منى العزيز', senderType: 'user',    body: 'أحتاج تغيير موعد الثلاثاء وزر التعديل لا يعمل معي على التطبيق.', time: '7:30 ص' },
    ],
  },
  5: {
    ...MOCK_TICKETS[4],
    createdAt: 'أمس',
    messages: [
      { id: 1, sender: 'د. منى عادل', senderType: 'user',    body: 'الأرقام في تقرير الإيرادات لا تتطابق مع ما توصلت إليه في حساباتي.', time: 'أمس' },
      { id: 2, sender: 'فريق الدعم',  senderType: 'support', body: 'نشكرك على الإبلاغ. هل يمكنك إرسال الفترة الزمنية التي يوجد بها الاختلاف؟', time: 'أمس' },
    ],
  },
  6: {
    ...MOCK_TICKETS[5],
    createdAt: 'أمس',
    messages: [
      { id: 1, sender: 'د. ليلى حسّان', senderType: 'user', body: 'كل ما أحاول رفع صورة للملف الشخصي تظهر رسالة خطأ: "unsupported format".', time: 'أمس' },
    ],
  },
  7: {
    ...MOCK_TICKETS[6],
    createdAt: 'منذ يومين',
    messages: [
      { id: 1, sender: 'صيدلية العافية', senderType: 'user', body: 'دواء باراسيتامول 500mg غير موجود في قائمة الأدوية على التطبيق.', time: 'منذ يومين' },
    ],
  },
};

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly cache = inject(CacheService);

  getKpiSummary(): Observable<SupportKpiSummary> {
    // TODO: replace with this.api.get<SupportKpiSummary>('api/Dashboard/getSupportSummary')
    return of(MOCK_KPI);
  }

  getTickets(): Observable<SupportTicket[]> {
    // TODO: replace with this.api.get<SupportTicket[]>('api/Dashboard/getSupportTickets')
    return of(MOCK_TICKETS);
  }

  getTicketDetail(id: number): Observable<TicketDetail> {
    // TODO: replace with this.api.get<TicketDetail>(`api/Dashboard/getSupportTicket/${id}`)
    return of(MOCK_DETAILS[id] ?? { ...MOCK_TICKETS[0], createdAt: '', messages: [] });
  }

  sendReply(ticketId: number, body: string): Observable<string> {
    // TODO: replace with this.api.postText(`api/Dashboard/replySupportTicket/${ticketId}`, { body })
    return of('تم إرسال الرد بنجاح');
  }

  closeTicket(ticketId: number): Observable<string> {
    // TODO: replace with this.api.putText(`api/Dashboard/closeSupportTicket/${ticketId}`, null)
    return of('تم إغلاق التذكرة');
  }
}
