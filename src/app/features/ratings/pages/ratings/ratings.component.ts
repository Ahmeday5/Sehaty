import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatingsService } from '../../services/ratings.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';
import {
  RatingsKpiSummary,
  Review,
  RatingDistribution,
  DoctorRating,
  ReviewFilter,
} from '../../models/ratings.model';

@Component({
  selector: 'app-ratings',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiStripComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ratings.component.html',
  styleUrl: './ratings.component.scss',
})
export class RatingsComponent implements OnInit {
  private readonly svc     = inject(RatingsService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast   = inject(ToastService);

  // ── Loading ──────────────────────────────────────────────────────────────
  protected readonly loadingKpi    = signal(true);
  protected readonly loadingList   = signal(true);
  protected readonly loadingStats  = signal(true);
  protected readonly publishingId  = signal<number | null>(null);
  protected readonly deletingId    = signal<number | null>(null);

  // ── Data ─────────────────────────────────────────────────────────────────
  protected readonly kpiSummary    = signal<RatingsKpiSummary | null>(null);
  protected readonly allReviews    = signal<Review[]>([]);
  protected readonly distribution  = signal<RatingDistribution[]>([]);
  protected readonly topDoctors    = signal<DoctorRating[]>([]);
  protected readonly bottomDoctors = signal<DoctorRating[]>([]);

  // ── Filter ───────────────────────────────────────────────────────────────
  protected activeFilter = signal<ReviewFilter>('pending');

  protected readonly displayed = computed<Review[]>(() => {
    const f   = this.activeFilter();
    const all = this.allReviews();
    switch (f) {
      case 'pending':  return all.filter((r) => r.status === 'pending');
      case 'flagged':  return all.filter((r) => r.flagged);
      case 'low':      return all.filter((r) => r.stars <= 2);
      default:         return all;
    }
  });

  // ── KPI strip ─────────────────────────────────────────────────────────────
  protected readonly kpiItems = computed<KpiItem[]>(() => {
    const s = this.kpiSummary();
    return [
      { icon: 'fa-star',            value: s ? String(s.averageRating)    : '—', label: 'متوسط التقييم العام',    variant: 'amber'   },
      { icon: 'fa-check-circle',    value: s ? s.publishedCount.toLocaleString('ar-EG') : '—', label: 'تقييمات منشورة',  variant: 'green'   },
      { icon: 'fa-triangle-exclamation', value: s ? String(s.pendingCount) : '—', label: 'بانتظار المراجعة',      variant: 'red'     },
      { icon: 'fa-trash',           value: s ? String(s.deletedThisMonth) : '—', label: 'محذوفة (هذا الشهر)',    variant: 'purple'  },
    ];
  });

  // ── Stars array helper ────────────────────────────────────────────────────
  protected starsArray(n: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < n);
  }

  ngOnInit(): void {
    this.loadAll();
  }

  // ── Filter change ─────────────────────────────────────────────────────────
  protected onFilterChange(val: string): void {
    this.activeFilter.set(val as ReviewFilter);
  }

  // ── Publish ───────────────────────────────────────────────────────────────
  protected async publishReview(review: Review): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'نشر التقييم',
      message:     `هل تريد نشر تقييم "${review.patientName}"؟`,
      confirmText: 'نشر',
      type:        'info',
    });
    if (!ok) return;

    this.publishingId.set(review.id);
    this.svc.publishReview(review.id).subscribe({
      next: (msg) => {
        this.toast.success(msg);
        this.allReviews.update((list) =>
          list.map((r) => r.id === review.id ? { ...r, status: 'published' as const } : r)
        );
        this.publishingId.set(null);
        this.decrementPending();
      },
      error: () => { this.toast.error('فشل نشر التقييم'); this.publishingId.set(null); },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  protected async deleteReview(review: Review): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'حذف التقييم',
      message:     `هل تريد حذف تقييم "${review.patientName}"؟`,
      confirmText: 'حذف',
      type:        'danger',
    });
    if (!ok) return;

    this.deletingId.set(review.id);
    this.svc.deleteReview(review.id).subscribe({
      next: (msg) => {
        this.toast.success(msg);
        this.allReviews.update((list) => list.filter((r) => r.id !== review.id));
        this.deletingId.set(null);
        this.decrementPending();
      },
      error: () => { this.toast.error('فشل حذف التقييم'); this.deletingId.set(null); },
    });
  }

  protected isPublishing(id: number): boolean { return this.publishingId() === id; }
  protected isDeleting(id:  number): boolean  { return this.deletingId()   === id; }

  // ── Private ───────────────────────────────────────────────────────────────
  private loadAll(): void {
    this.svc.getKpiSummary().subscribe({
      next: (d) => { this.kpiSummary.set(d); this.loadingKpi.set(false); },
      error: ()  => this.loadingKpi.set(false),
    });

    this.svc.getReviews().subscribe({
      next: (d) => { this.allReviews.set(d); this.loadingList.set(false); },
      error: ()  => this.loadingList.set(false),
    });

    this.svc.getDistribution().subscribe({ next: (d) => this.distribution.set(d) });
    this.svc.getTopDoctors().subscribe({
      next: (d) => {
        this.topDoctors.set(d);
        this.loadingStats.set(false);
      },
    });
    this.svc.getBottomDoctors().subscribe({ next: (d) => this.bottomDoctors.set(d) });
  }

  private decrementPending(): void {
    this.kpiSummary.update((s) =>
      s ? { ...s, pendingCount: Math.max(0, s.pendingCount - 1) } : s
    );
  }
}
