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
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RatingsService } from '../../services/ratings.service';
import { ToastService } from '../../../../core/services/toast.service';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import {
  DoctorRatingItem,
  RatingDistributionItem,
  RankedDoctor,
} from '../../models/ratings.model';

const PAGE_SIZE = 10;
const DEFAULT_RANK_COUNT = 10;

@Component({
  selector: 'app-ratings',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiStripComponent, PaginationComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ratings.component.html',
  styleUrl: './ratings.component.scss',
})
export class RatingsComponent implements OnInit {
  private readonly svc   = inject(RatingsService);
  private readonly toast = inject(ToastService);

  // ── Loading ──────────────────────────────────────────────────────────────
  protected readonly loadingList  = signal(true);
  protected readonly loadingDist  = signal(true);
  protected readonly loadingRank  = signal(true);

  // ── Data ─────────────────────────────────────────────────────────────────
  protected readonly reviews      = signal<DoctorRatingItem[]>([]);
  protected readonly total        = signal(0);
  protected readonly distribution = signal<RatingDistributionItem[]>([]);
  protected readonly distTotal    = signal(0);
  protected readonly topDoctors   = signal<RankedDoctor[]>([]);
  protected readonly worstDoctors = signal<RankedDoctor[]>([]);

  // ── Filters ──────────────────────────────────────────────────────────────
  protected readonly currentPage  = signal(1);
  protected readonly starsFilter  = signal<number | null>(null);
  protected doctorNameValue = '';
  private readonly search$ = new Subject<string>();

  // ── Ranking count controls ───────────────────────────────────────────────
  protected topCount    = DEFAULT_RANK_COUNT;
  protected bottomCount = DEFAULT_RANK_COUNT;

  protected readonly pageSize = signal(PAGE_SIZE);

  protected readonly maxDistCount = computed(() =>
    Math.max(1, ...this.distribution().map((d) => d.count)),
  );

  protected readonly averageRating = computed<number>(() => {
    const rows = this.distribution();
    const total = this.distTotal();
    if (!total) return 0;
    const weighted = rows.reduce((sum, r) => sum + r.stars * r.count, 0);
    return Math.round((weighted / total) * 10) / 10;
  });

  protected readonly kpiItems = computed<KpiItem[]>(() => [
    { icon: 'fa-star',         value: this.distTotal() ? String(this.averageRating()) : '—', label: 'متوسط التقييم العام', variant: 'amber' },
    { icon: 'fa-comment-dots', value: this.distTotal().toLocaleString('ar-EG'),               label: 'إجمالي التقييمات',    variant: 'primary' },
    { icon: 'fa-trophy',       value: this.topDoctors()[0]?.doctorName ?? '—',                label: 'الأعلى تقييماً',      variant: 'green' },
    { icon: 'fa-triangle-exclamation', value: this.worstDoctors()[0]?.doctorName ?? '—',      label: 'الأدنى تقييماً',      variant: 'red' },
  ]);

  ngOnInit(): void {
    this.loadReviews();
    this.loadDistribution();
    this.loadRanking();

    this.search$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((q) => {
      this.doctorNameValue = q;
      this.currentPage.set(1);
      this.loadReviews();
    });
  }

  protected starsArray(n: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < n);
  }

  protected onSearchChange(query: string): void { this.search$.next(query); }

  protected onStarsFilterChange(val: string): void {
    this.starsFilter.set(val ? Number(val) : null);
    this.currentPage.set(1);
    this.loadReviews();
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadReviews();
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadReviews();
  }

  protected onRankCountChange(): void {
    this.topCount    = this.clampRankCount(this.topCount);
    this.bottomCount = this.clampRankCount(this.bottomCount);
    this.loadRanking();
  }

  private clampRankCount(n: number): number {
    if (!n || n < 1) return 1;
    return Math.min(n, 200);
  }

  private loadReviews(): void {
    this.loadingList.set(true);
    this.svc.getDoctorRatings({
      stars:      this.starsFilter() ?? undefined,
      doctorName: this.doctorNameValue.trim() || undefined,
      page:       this.currentPage(),
      pageSize:   this.pageSize(),
    }).subscribe({
      next: (res) => {
        this.reviews.set(res.data ?? []);
        this.total.set(res.total ?? 0);
        this.loadingList.set(false);
      },
      error: () => {
        this.reviews.set([]);
        this.total.set(0);
        this.loadingList.set(false);
        this.toast.error('فشل تحميل التقييمات');
      },
    });
  }

  private loadDistribution(): void {
    this.loadingDist.set(true);
    this.svc.getRatingsDistribution().subscribe({
      next: (res) => {
        this.distribution.set((res.data ?? []).slice().sort((a, b) => b.stars - a.stars));
        this.distTotal.set(res.total ?? 0);
        this.loadingDist.set(false);
      },
      error: () => {
        this.distribution.set([]);
        this.distTotal.set(0);
        this.loadingDist.set(false);
      },
    });
  }

  private loadRanking(): void {
    this.loadingRank.set(true);
    this.svc.getTopAndWorstRatedDoctors(this.topCount, this.bottomCount).subscribe({
      next: (res) => {
        this.topDoctors.set(res.topRated ?? []);
        this.worstDoctors.set(res.worstRated ?? []);
        this.loadingRank.set(false);
      },
      error: () => {
        this.topDoctors.set([]);
        this.worstDoctors.set([]);
        this.loadingRank.set(false);
        this.toast.error('فشل تحميل ترتيب الأطباء');
      },
    });
  }
}
