import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  RatingsKpiSummary, Review, RatingDistribution, DoctorRating,
} from '../models/ratings.model';

const MOCK_REVIEWS: Review[] = [
  {
    id: 1, initial: 'ك', patientName: 'كريم سعيد',
    doctorName: 'د. أحمد الشرقاوي', dateLabel: 'اليوم',
    stars: 5, flagged: false, status: 'pending',
    text: 'طبيب ممتاز جداً، شرح الحالة بالكامل وكان متعاوناً. أنصح به بشدة.',
  },
  {
    id: 2, initial: 'س', patientName: 'سارة محمود',
    doctorName: 'د. ليلى حسّان', dateLabel: 'اليوم',
    stars: 4, flagged: false, status: 'pending',
    text: 'تجربة جيدة، الانتظار كان طويل شوية لكن الطبيبة كانت رائعة.',
  },
  {
    id: 3, initial: 'م', patientName: 'منى العزيز',
    doctorName: 'د. سارة نور', dateLabel: 'أمس',
    stars: 2, flagged: true, status: 'pending',
    text: 'الموعد تأخر ساعة كاملة بدون أي إشعار. مش مبسوطة.',
  },
  {
    id: 4, initial: 'ه', patientName: 'هالة فاروق',
    doctorName: 'د. عمر الخطيب', dateLabel: 'منذ يومين',
    stars: 1, flagged: true, status: 'pending',
    text: 'كلام غير مناسب للطاقم الطبي. لن أعود مرة أخرى.',
  },
  {
    id: 5, initial: 'أ', patientName: 'أحمد نجيب',
    doctorName: 'د. فادي حلمي', dateLabel: 'منذ 3 أيام',
    stars: 5, flagged: false, status: 'published',
    text: 'الدكتور محترم جداً وعنده خبرة عالية. شكراً.',
  },
  {
    id: 6, initial: 'ر', patientName: 'رنا طارق',
    doctorName: 'د. ياسر فريد', dateLabel: 'منذ 3 أيام',
    stars: 3, flagged: false, status: 'published',
    text: 'الخدمة عادية، لكن المكان نظيف والعيادة منظمة.',
  },
  {
    id: 7, initial: 'ن', patientName: 'نور الدين',
    doctorName: 'د. أحمد الشرقاوي', dateLabel: 'منذ 4 أيام',
    stars: 2, flagged: false, status: 'published',
    text: 'الانتظار كان طويل جداً والمساعد لم يكن متعاوناً.',
  },
];

const MOCK_DISTRIBUTION: RatingDistribution[] = [
  { star: 5, count: 323, percent: 100, color: 'green' },
  { star: 4, count: 281, percent: 87,  color: 'green' },
  { star: 3, count: 90,  percent: 28,  color: 'amber' },
  { star: 2, count: 61,  percent: 19,  color: 'red'   },
  { star: 1, count: 41,  percent: 13,  color: 'red'   },
];

const MOCK_TOP: DoctorRating[] = [
  { rank: 1, name: 'د. أحمد الشرقاوي', rating: 4.9, isTop: true },
  { rank: 2, name: 'د. سارة نور',       rating: 4.9, isTop: true },
  { rank: 3, name: 'د. ليلى حسّان',     rating: 4.8, isTop: true },
];

const MOCK_BOTTOM: DoctorRating[] = [
  { name: 'د. فادي حلمي',  rating: 4.5, isTop: false },
  { name: 'د. ياسر فريد', rating: 4.5, isTop: false },
];

@Injectable({ providedIn: 'root' })
export class RatingsService {

  // TODO: GET /api/ratings/kpi
  getKpiSummary(): Observable<RatingsKpiSummary> {
    return of({
      averageRating:    4.7,
      totalCount:       4840,
      publishedCount:   4612,
      pendingCount:     18,
      deletedThisMonth: 210,
    }).pipe(delay(400));
  }

  // TODO: GET /api/ratings/reviews?filter=...
  getReviews(): Observable<Review[]> {
    return of(MOCK_REVIEWS).pipe(delay(350));
  }

  // TODO: GET /api/ratings/distribution
  getDistribution(): Observable<RatingDistribution[]> {
    return of(MOCK_DISTRIBUTION).pipe(delay(300));
  }

  // TODO: GET /api/ratings/doctors/top
  getTopDoctors(): Observable<DoctorRating[]> {
    return of(MOCK_TOP).pipe(delay(300));
  }

  // TODO: GET /api/ratings/doctors/bottom
  getBottomDoctors(): Observable<DoctorRating[]> {
    return of(MOCK_BOTTOM).pipe(delay(300));
  }

  // TODO: POST /api/ratings/:id/publish
  publishReview(id: number): Observable<string> {
    return of('تم نشر التقييم بنجاح').pipe(delay(500));
  }

  // TODO: DELETE /api/ratings/:id
  deleteReview(id: number): Observable<string> {
    return of('تم حذف التقييم').pipe(delay(500));
  }
}
