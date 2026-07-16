import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PharmacyStatsService } from '../../services/pharmacy-stats.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  ORDER_STATUS_SLICES,
  OrderStatusSlice,
  PharmacyMainPageStats,
} from '../../models/pharmacy-stats.model';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';
import { DateArPipe } from '../../../../shared/pipes/date-ar.pipe';

interface StatusSliceView extends OrderStatusSlice {
  count: number;
  pct: number;
}

interface DonutTooltip {
  label: string;
  count: number;
  pct: number;
  color: string;
}

const EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);

@Component({
  selector: 'app-pharmacy-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyArPipe, DateArPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pharmacy-dashboard.component.html',
  styleUrl: './pharmacy-dashboard.component.scss',
})
export class PharmacyDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('donutCanvas') private donutRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('gaugeCanvas') private gaugeRef?: ElementRef<HTMLCanvasElement>;

  private readonly svc   = inject(PharmacyStatsService);
  private readonly toast = inject(ToastService);
  private readonly zone  = inject(NgZone);

  protected readonly loading    = signal(true);
  protected readonly refreshing = signal(false);
  protected readonly stats      = signal<PharmacyMainPageStats | null>(null);
  protected readonly lastUpdated = signal<Date | null>(null);

  /** Count-up display values — animated independently from the raw stats signal. */
  protected readonly heroRevenue    = signal(0);
  protected readonly gaugePctDisplay = signal(0);
  protected readonly revBarPctThisMonth = signal(0);
  protected readonly revBarPctLastMonth = signal(0);

  protected readonly donutHoverIndex = signal<number | null>(null);
  protected readonly donutTooltip    = signal<DonutTooltip | null>(null);

  protected readonly statusSlices = computed<StatusSliceView[]>(() => {
    const byStatus = this.stats()?.orders.byStatus;
    if (!byStatus) return [];
    const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
    return ORDER_STATUS_SLICES
      .map((slice) => {
        const count = byStatus[slice.key];
        return { ...slice, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
      })
      .filter((slice) => slice.count > 0);
  });

  protected readonly totalOrdersInDonut = computed(() =>
    this.statusSlices().reduce((sum, s) => sum + s.count, 0),
  );

  protected readonly catalogAvailablePct = computed(() => {
    const c = this.stats()?.catalog;
    if (!c || c.totalItems === 0) return 0;
    return Math.round((c.availableItems / c.totalItems) * 100);
  });

  protected readonly revenueDeltaPositive = computed(() => (this.stats()?.revenue.changePercent ?? 0) >= 0);

  protected readonly hasActionItems = computed(() => {
    const s = this.stats();
    return !!s && (s.orders.pendingActionCount > 0 || s.prescriptions.pendingReviewCount > 0);
  });

  private heroRafId  = 0;
  private gaugeRafId = 0;
  private gaugeArcRafId = 0;
  private donutRafId = 0;

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.heroRafId);
    cancelAnimationFrame(this.gaugeRafId);
    cancelAnimationFrame(this.gaugeArcRafId);
    cancelAnimationFrame(this.donutRafId);
  }

  protected refresh(): void {
    this.load();
  }

  private load(): void {
    const isFirstLoad = this.stats() === null;
    if (isFirstLoad) this.loading.set(true);
    else this.refreshing.set(true);

    this.svc.getMainPageStats().subscribe({
      next: (res) => {
        this.stats.set(res);
        this.loading.set(false);
        this.refreshing.set(false);
        this.lastUpdated.set(new Date());

        // Wait for Angular to render the now-visible dashboard sections (canvases
        // included) before measuring/drawing on them.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          this.animateHeroRevenue(res.revenue.total);
          this.animateRevenueBars(res.revenue.thisMonth, res.revenue.lastMonth);
          this.animateGaugePct(this.catalogAvailablePct());
          this.drawDonut();
          this.drawGauge();
        }));
      },
      error: () => {
        this.loading.set(false);
        this.refreshing.set(false);
        this.toast.error('فشل تحميل إحصائيات لوحة التحكم');
      },
    });
  }

  // ── Count-up animations ───────────────────────────────────────────

  private animateHeroRevenue(target: number): void {
    cancelAnimationFrame(this.heroRafId);
    const DURATION = 1100;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min((ts - start) / DURATION, 1);
      this.heroRevenue.set(target * EASE_OUT_CUBIC(t));
      if (t < 1) this.heroRafId = requestAnimationFrame(tick);
      else this.heroRevenue.set(target);
    };
    this.heroRafId = requestAnimationFrame(tick);
  }

  private animateGaugePct(target: number): void {
    cancelAnimationFrame(this.gaugeArcRafId);
    const DURATION = 1000;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min((ts - start) / DURATION, 1);
      this.gaugePctDisplay.set(Math.round(target * EASE_OUT_CUBIC(t)));
      if (t < 1) this.gaugeArcRafId = requestAnimationFrame(tick);
      else this.gaugePctDisplay.set(target);
    };
    this.gaugeArcRafId = requestAnimationFrame(tick);
  }

  private animateRevenueBars(thisMonth: number, lastMonth: number): void {
    const max = Math.max(thisMonth, lastMonth, 1);
    this.revBarPctThisMonth.set(0);
    this.revBarPctLastMonth.set(0);
    // Double rAF so the browser paints the 0% state first, letting the CSS
    // transition actually animate the grow-in rather than jumping straight there.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this.revBarPctThisMonth.set(Math.round((thisMonth / max) * 100));
      this.revBarPctLastMonth.set(Math.round((lastMonth / max) * 100));
    }));
  }

  // ── Donut chart: orders by status ─────────────────────────────────

  private drawDonut(): void {
    const canvas = this.donutRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const slices = this.statusSlices();
    if (!slices.length) return;

    // Reset any hover state left over from before a refresh — the new slice
    // array may have a different length, so a stale index could otherwise
    // point at the wrong (or no) slice for one frame.
    this.donutHoverIndex.set(null);
    this.donutTooltip.set(null);

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 220;
    canvas.width = SIZE * DPR;
    canvas.height = SIZE * DPR;
    canvas.style.width = SIZE + 'px';
    canvas.style.height = SIZE + 'px';
    ctx.scale(DPR, DPR);

    const cx = 110, cy = 110, outerR = 96, innerR = 64;
    const GAP = 0.025;
    const total = slices.reduce((s, sl) => s + sl.count, 0);
    const DURATION = 900;
    let startTime: number | null = null;

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      let angle = -Math.PI / 2;

      slices.forEach((sl, i) => {
        const fullSweep = (sl.count / total) * 2 * Math.PI;
        const animSweep = fullSweep * progress;
        const sweep = Math.max(0, animSweep - GAP);
        if (sweep <= 0) { angle += animSweep; return; }

        const isHovered = i === this.donutHoverIndex();
        const or = isHovered ? outerR + 6 : outerR;
        const ir = isHovered ? innerR - 2 : innerR;

        ctx.beginPath();
        ctx.moveTo(cx + ir * Math.cos(angle + GAP / 2), cy + ir * Math.sin(angle + GAP / 2));
        ctx.arc(cx, cy, or, angle + GAP / 2, angle + sweep);
        ctx.arc(cx, cy, ir, angle + sweep, angle + GAP / 2, true);
        ctx.closePath();

        const grad = ctx.createRadialGradient(cx, cy, ir, cx, cy, or);
        grad.addColorStop(0, sl.color + 'cc');
        grad.addColorStop(1, sl.color);
        ctx.fillStyle = grad;

        if (isHovered) { ctx.shadowColor = sl.color; ctx.shadowBlur = 18; }
        ctx.fill();
        ctx.shadowBlur = 0;
        angle += animSweep;
      });
    };

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const t = Math.min((ts - startTime) / DURATION, 1);
      draw(EASE_OUT_CUBIC(t));
      if (t < 1) {
        this.donutRafId = requestAnimationFrame(tick);
      } else {
        this.bindDonutHover(canvas, cx, cy, outerR, innerR, total, draw, slices);
      }
    };

    this.zone.runOutsideAngular(() => {
      this.donutRafId = requestAnimationFrame(tick);
    });
  }

  private bindDonutHover(
    canvas: HTMLCanvasElement, cx: number, cy: number, outerR: number, innerR: number,
    total: number, draw: (p: number) => void, slices: StatusSliceView[],
  ): void {
    canvas.onmousemove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dx = e.clientX - rect.left - cx;
      const dy = e.clientY - rect.top - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < innerR || dist > outerR + 8) {
        if (this.donutHoverIndex() !== null) {
          this.zone.run(() => { this.donutHoverIndex.set(null); this.donutTooltip.set(null); });
          draw(1);
        }
        return;
      }

      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;
      let a = -Math.PI / 2, found = -1;
      for (let i = 0; i < slices.length; i++) {
        const sweep = (slices[i].count / total) * 2 * Math.PI;
        if (angle >= a && angle < a + sweep) { found = i; break; }
        a += sweep;
      }

      if (found !== this.donutHoverIndex()) {
        this.zone.run(() => {
          this.donutHoverIndex.set(found >= 0 ? found : null);
          this.donutTooltip.set(
            found >= 0
              ? { label: slices[found].label, count: slices[found].count, pct: slices[found].pct, color: slices[found].color }
              : null,
          );
        });
        draw(1);
      }
    };

    canvas.onmouseleave = () => {
      this.zone.run(() => { this.donutHoverIndex.set(null); this.donutTooltip.set(null); });
      draw(1);
    };
  }

  // ── Gauge: catalog availability ring ──────────────────────────────

  private drawGauge(): void {
    const canvas = this.gaugeRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const catalog = this.stats()?.catalog;
    if (!catalog || catalog.totalItems === 0) return;

    const pct = catalog.availableItems / catalog.totalItems;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 180;
    canvas.width = SIZE * DPR;
    canvas.height = SIZE * DPR;
    canvas.style.width = SIZE + 'px';
    canvas.style.height = SIZE + 'px';
    ctx.scale(DPR, DPR);

    const cx = 90, cy = 90, r = 74, lineWidth = 14;
    const startAngle = -Math.PI / 2;
    const DURATION = 1000;
    let startTime: number | null = null;

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      const sweep = pct * 2 * Math.PI * progress;
      if (sweep > 0) {
        const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
        grad.addColorStop(0, '#14B8A6');
        grad.addColorStop(1, '#0EA5E9');

        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, startAngle + sweep);
        ctx.strokeStyle = grad;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(20,184,166,0.5)';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const t = Math.min((ts - startTime) / DURATION, 1);
      draw(EASE_OUT_CUBIC(t));
      if (t < 1) this.gaugeRafId = requestAnimationFrame(tick);
      else draw(1);
    };

    this.zone.runOutsideAngular(() => {
      this.gaugeRafId = requestAnimationFrame(tick);
    });
  }
}
