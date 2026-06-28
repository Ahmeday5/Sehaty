import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CacheService } from '../../../../core/services/cache.service';
import {
  AppointmentStatus,
  ActivityRecipientType,
  SpecialtyDistributionItem,
  LatestAppointmentItem,
  ActivityLogItem,
} from '../../models/dashboard.model';

// ── View-layer interfaces ─────────────────────────────────────────────────────

interface CardStat {
  label:      string;
  value:      number;
  valueSub:   string;
  icon:       string;
  gradient:   string;
  isCurrency: boolean;
}

interface RevBar {
  label: string;
  raw:   number;
  pct:   number;
}

interface Booking {
  id:          string;
  patient:     string;
  doctor:      string;
  time:        string;
  status:      string;
  statusClass: string;
}

interface ActivityItem {
  id:          number;
  icon:        string;
  nodeColor:   string;
  bgColor:     string;
  title:       string;
  description: string;
  time:        string;
  typeLabel:   string;
  typeClass:   string;
}

interface Specialty {
  label: string;
  pct:   number;
  color: string;
  count: number;
}

// ── Static color / label maps ─────────────────────────────────────────────────

const SPECIALTY_COLORS = ['#0EA5E9', '#14B8A6', '#22C55E', '#A78BFA', '#F59E0B', '#EF4444', '#EC4899'];

const STATUS_MAP: Record<AppointmentStatus, { label: string; cls: string }> = {
  Pending:   { label: 'قيد الانتظار', cls: 'db-status--amber' },
  Confirmed: { label: 'مؤكّد',        cls: 'db-status--blue'  },
  Completed: { label: 'مكتمل',        cls: 'db-status--teal'  },
  Cancelled: { label: 'ملغى',          cls: 'db-status--red'   },
  Rejected:  { label: 'مرفوض',        cls: 'db-status--red'   },
};

const RECIPIENT_MAP: Record<ActivityRecipientType, { icon: string; nodeColor: string; bgColor: string; typeLabel: string; typeClass: string }> = {
  Doctor:   { icon: 'fa-user-doctor',   nodeColor: '#a78bfa', bgColor: 'rgba(167,139,250,.1)', typeLabel: 'طبيب',   typeClass: 'db-atype--purple' },
  Patient:  { icon: 'fa-user',          nodeColor: '#0ea5e9', bgColor: 'rgba(14,165,233,.1)',  typeLabel: 'مريض',   typeClass: 'db-atype--blue'   },
  Admin:    { icon: 'fa-shield-halved', nodeColor: '#22c55e', bgColor: 'rgba(34,197,94,.1)',   typeLabel: 'مشرف',   typeClass: 'db-atype--green'  },
  System:   { icon: 'fa-gear',          nodeColor: '#f59e0b', bgColor: 'rgba(245,158,11,.1)',  typeLabel: 'نظام',   typeClass: 'db-atype--amber'  },
  Pharmacy: { icon: 'fa-pills',         nodeColor: '#14b8a6', bgColor: 'rgba(20,184,166,.1)',  typeLabel: 'صيدلية', typeClass: 'db-atype--teal'   },
};

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('donutCanvas') private donutRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas')   private barRef!:   ElementRef<HTMLCanvasElement>;

  private readonly svc   = inject(DashboardService);
  private readonly toast = inject(ToastService);
  readonly cache         = inject(CacheService);
  private readonly zone  = inject(NgZone);

  protected readonly loading        = signal(false);
  protected readonly cardStats      = signal<CardStat[]>([]);
  protected readonly lastUpdate     = signal<Date | null>(null);
  protected readonly revBars        = signal<RevBar[]>([]);
  protected readonly specialties    = signal<Specialty[]>([]);
  protected readonly donutTotal     = signal(0);
  protected readonly recentBookings = signal<Booking[]>([]);
  protected readonly activityLog    = signal<ActivityItem[]>([]);

  // ── User-controlled parameters ────────────────────────────────────────────
  protected readonly revMode         = signal<'month' | 'week'>('month');
  protected readonly revCount        = signal(8);
  protected readonly apptCount       = signal(10);
  protected readonly actHours        = signal(24);
  protected readonly actCount        = signal(20);
  protected readonly revLoading      = signal(false);
  protected readonly apptLoading     = signal(false);
  protected readonly actLoading      = signal(false);

  // ── Donut tooltip ─────────────────────────────────────────────────────────
  protected readonly donutTooltip    = signal<{ label: string; pct: number; count: number; color: string } | null>(null);

  private rafId              = 0;
  private barRafId           = 0;
  private donutHover         = -1;
  private barHover           = -1;
  private currentBarData: { label: string; raw: number }[] = [];
  private donutRawData: SpecialtyDistributionItem[] = [];

  constructor() {
    effect(() => {
      if (!this.loading()) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.drawDonut();
            this.animateBarChart(this.currentBarData);
          });
        });
      }
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void { /* charts triggered via effect() */ }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    cancelAnimationFrame(this.barRafId);
  }

  refresh(): void {
    this.cache.invalidate('Dashboard');
    this.loadAll();
  }

  setRevView(mode: 'month' | 'week', e: Event): void {
    const btns = (e.target as HTMLElement).closest('.db-pill-toggle')?.querySelectorAll('.db-ptoggle-btn');
    btns?.forEach(b => b.classList.remove('active'));
    (e.target as HTMLElement).classList.add('active');
    this.revMode.set(mode);
    this.fetchRevChart();
  }

  onRevCountChange(val: number): void {
    const clamped = Math.max(2, Math.min(60, val || 8));
    this.revCount.set(clamped);
    this.fetchRevChart();
  }

  onApptCountChange(val: number): void {
    const clamped = Math.max(1, Math.min(100, val || 10));
    this.apptCount.set(clamped);
    this.fetchAppointments();
  }

  onActParamsChange(hours: number, count: number): void {
    this.actHours.set(Math.max(1, Math.min(720, hours || 24)));
    this.actCount.set(Math.max(1, Math.min(200, count || 20)));
    this.fetchActivity();
  }

  private fetchRevChart(): void {
    this.revLoading.set(true);
    const type = this.revMode() === 'month' ? 'monthly' : 'weekly';
    this.svc.getRevenueChart(type, this.revCount()).subscribe({
      next: (res) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? []);
        const data = (raw as any[]).map((p: any) => ({ label: p.label, raw: p.revenue ?? 0 }));
        this.currentBarData = data;
        this.buildRevBars(data);
        this.revLoading.set(false);
        // canvas is always in the DOM (overlay covers it) — one rAF is enough
        requestAnimationFrame(() => this.animateBarChart(data));
      },
      error: () => {
        this.toast.error('فشل في جلب بيانات الإيرادات');
        this.revLoading.set(false);
      },
    });
  }

  private fetchAppointments(): void {
    this.apptLoading.set(true);
    this.svc.getLatestAppointments(this.apptCount()).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : (res?.data ?? []);
        this.buildBookings(data as LatestAppointmentItem[]);
        this.apptLoading.set(false);
      },
      error: () => {
        this.toast.error('فشل في جلب الحجوزات');
        this.apptLoading.set(false);
      },
    });
  }

  private fetchActivity(): void {
    this.actLoading.set(true);
    this.svc.getActivityLog(this.actHours(), this.actCount()).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : (res?.data ?? []);
        this.buildActivityLog(data as ActivityLogItem[]);
        this.actLoading.set(false);
      },
      error: () => {
        this.toast.error('فشل في جلب سجل النشاط');
        this.actLoading.set(false);
      },
    });
  }

  // ── Data loading ─────────────────────────────────────────────────────────

  private loadAll(): void {
    this.loading.set(true);
    forkJoin({
      stats:        this.svc.getMainPageStats().pipe(catchError(() => of(null))),
      revenueChart: this.svc.getRevenueChart('monthly', 8).pipe(catchError(() => of(null))),
      specialties:  this.svc.getSpecialtyDistribution().pipe(catchError(() => of(null))),
      appointments: this.svc.getLatestAppointments(10).pipe(catchError(() => of(null))),
      activity:     this.svc.getActivityLog(24, 20).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ stats, revenueChart, specialties, appointments, activity }) => {
        if (stats) {
          this.buildCards(stats.revenue, stats.todayAppointments, stats.activeDoctors, stats.patients);
        }
        if (revenueChart) {
          const chartData = Array.isArray(revenueChart)
            ? (revenueChart as any[]).map((p: any) => ({ label: p.label, raw: p.revenue }))
            : (revenueChart.data ?? []).map((p: any) => ({ label: p.label, raw: p.revenue }));
          this.currentBarData = chartData;
          this.buildRevBars(chartData);
        }
        if (specialties) {
          const specData  = Array.isArray(specialties) ? specialties : (specialties.data ?? []);
          const specTotal = Array.isArray(specialties) ? 0 : (specialties.total ?? 0);
          this.buildSpecialties(specData, specTotal);
        }
        if (appointments) {
          const apptData = Array.isArray(appointments) ? appointments : (appointments.data ?? []);
          this.buildBookings(apptData);
        }
        if (activity) {
          const actData = Array.isArray(activity) ? activity : (activity.data ?? []);
          this.buildActivityLog(actData);
        }
        this.lastUpdate.set(new Date());
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('فشل في جلب بيانات لوحة التحكم');
        this.loading.set(false);
      },
    });
  }

  // ── Builders ──────────────────────────────────────────────────────────────

  private buildCards(
    revenue:    { total: number; changePercent: number },
    todayAppts: { count: number; attendanceRate: number },
    activeDocs: { count: number },
    patients:   { total: number; newThisMonthCount: number; newThisMonthPercent: number },
  ): void {
    const sign = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
    this.cardStats.set([
      {
        label:      'الإيرادات الإجمالية',
        value:      revenue.total,
        valueSub:   `${sign(revenue.changePercent)} هذا الشهر`,
        icon:       'fa-circle-dollar-to-slot',
        gradient:   'linear-gradient(135deg,#f6d365 0%,#fda085 100%)',
        isCurrency: true,
      },
      {
        label:      'مواعيد اليوم',
        value:      todayAppts.count,
        valueSub:   `${todayAppts.attendanceRate.toFixed(0)}% معدل الحضور`,
        icon:       'fa-calendar-check',
        gradient:   'linear-gradient(135deg,#10b981 0%,#059669 100%)',
        isCurrency: false,
      },
      {
        label:      'الأطباء النشطون',
        value:      activeDocs.count,
        valueSub:   'في الخدمة الآن',
        icon:       'fa-user-doctor',
        gradient:   'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
        isCurrency: false,
      },
      {
        label:      'إجمالي المرضى',
        value:      patients.total,
        valueSub:   `+${patients.newThisMonthCount} جديد هذا الشهر`,
        icon:       'fa-users',
        gradient:   'linear-gradient(135deg,#14c8c7 0%,#0891b2 100%)',
        isCurrency: false,
      },
    ]);
  }

  private buildRevenueChart(data: { label: string; revenue: number }[]): void {
    if (!data?.length) return;
    const mapped = data.map(p => ({ label: p.label, raw: p.revenue ?? 0 }));
    this.currentBarData = mapped;
    this.buildRevBars(mapped);
  }

  private buildRevBars(data: { label: string; raw: number }[]): void {
    if (!data?.length) return;
    const max = Math.max(...data.map(d => d.raw), 1);
    this.revBars.set(data.map(d => ({
      label: d.label,
      raw:   d.raw,
      pct:   Math.round((d.raw / max) * 100),
    })));
  }

  private buildSpecialties(data: SpecialtyDistributionItem[], total: number): void {
    if (!data?.length) return;
    this.donutRawData = data;
    this.donutTotal.set(total);
    this.specialties.set(data.map((item, i) => ({
      label: item.specialization,
      pct:   item.percentage,
      color: SPECIALTY_COLORS[i % SPECIALTY_COLORS.length],
      count: item.count,
    })));
  }

  private buildBookings(data: LatestAppointmentItem[]): void {
    if (!data?.length) return;
    this.recentBookings.set(data.map(a => {
      const map = STATUS_MAP[a.status] ?? { label: a.status, cls: 'db-status--amber' };
      return {
        id:          a.id,
        patient:     a.patientName,
        doctor:      a.doctorName,
        time:        this.formatApptDate(a.date, a.slotStartTime),
        status:      map.label,
        statusClass: map.cls,
      };
    }));
  }

  private buildActivityLog(data: ActivityLogItem[]): void {
    if (!data?.length) return;
    this.activityLog.set(data.map(item => {
      const map = RECIPIENT_MAP[item.recipientType] ?? RECIPIENT_MAP['System'];
      return {
        id:          item.id,
        icon:        map.icon,
        nodeColor:   map.nodeColor,
        bgColor:     map.bgColor,
        title:       item.title,
        description: item.description,
        time:        this.formatRelativeTime(item.createdAt),
        typeLabel:   map.typeLabel,
        typeClass:   map.typeClass,
      };
    }));
  }

  // ── Date helpers ──────────────────────────────────────────────────────────

  private formatApptDate(dateStr: string, timeStr: string): string {
    try {
      const d   = new Date(dateStr);
      const now = new Date();
      const isToday =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth()    === now.getMonth()    &&
        d.getDate()     === now.getDate();
      const dayLabel = isToday ? 'اليوم' : d.toLocaleDateString('ar-EG', { weekday: 'long' });
      return `${dayLabel} — ${timeStr}`;
    } catch {
      return `${dateStr} ${timeStr}`;
    }
  }

  private formatRelativeTime(isoString: string): string {
    try {
      const diffMs  = Date.now() - new Date(isoString).getTime();
      const diffMin = Math.floor(diffMs / 60_000);
      if (diffMin < 1)  return 'الآن';
      if (diffMin < 60) return `منذ ${diffMin} دق`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24)   return diffH === 1 ? 'منذ ساعة' : `منذ ${diffH} ساعات`;
      const diffD = Math.floor(diffH / 24);
      return diffD === 1 ? 'منذ يوم' : `منذ ${diffD} أيام`;
    } catch {
      return '';
    }
  }

  /* ══════════════════════════════════
     DONUT CHART — animated sweep
  ══════════════════════════════════ */
  private drawDonut(): void {
    const canvas = this.donutRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const specs = this.specialties();
    if (!specs.length) return;

    const DPR   = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE  = 200;
    canvas.width  = SIZE * DPR;
    canvas.height = SIZE * DPR;
    canvas.style.width  = SIZE + 'px';
    canvas.style.height = SIZE + 'px';
    ctx.scale(DPR, DPR);

    const cx = 100, cy = 100, outerR = 86, innerR = 54;
    const GAP      = 0.025;
    const total    = specs.reduce((s, sp) => s + sp.pct, 0);
    const DURATION = 900;
    let startTime: number | null = null;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      let angle = -Math.PI / 2;

      specs.forEach((sp, i) => {
        const fullSweep = (sp.pct / total) * 2 * Math.PI;
        const animSweep = fullSweep * progress;
        const sweep     = Math.max(0, animSweep - GAP);
        if (sweep <= 0) { angle += animSweep; return; }

        const isHovered = i === this.donutHover;
        const or = isHovered ? outerR + 6 : outerR;
        const ir = isHovered ? innerR - 2 : innerR;

        ctx.beginPath();
        ctx.moveTo(cx + ir * Math.cos(angle + GAP / 2), cy + ir * Math.sin(angle + GAP / 2));
        ctx.arc(cx, cy, or, angle + GAP / 2, angle + sweep);
        ctx.arc(cx, cy, ir, angle + sweep, angle + GAP / 2, true);
        ctx.closePath();

        const grad = ctx.createRadialGradient(cx, cy, ir, cx, cy, or);
        grad.addColorStop(0, sp.color + 'cc');
        grad.addColorStop(1, sp.color);
        ctx.fillStyle = grad;

        if (isHovered) { ctx.shadowColor = sp.color; ctx.shadowBlur = 18; }
        ctx.fill();
        ctx.shadowBlur = 0;
        angle += animSweep;
      });

      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
      glowGrad.addColorStop(0, 'rgba(20,200,170,0.08)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();
    };

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const t = Math.min((ts - startTime) / DURATION, 1);
      draw(easeOutCubic(t));
      if (t < 1) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.setupDonutHover(canvas, cx, cy, outerR, innerR, GAP, total, draw, specs);
      }
    };

    this.zone.runOutsideAngular(() => { this.rafId = requestAnimationFrame(tick); });
  }

  private setupDonutHover(
    canvas: HTMLCanvasElement,
    cx: number, cy: number,
    outerR: number, innerR: number,
    GAP: number, total: number,
    draw: (p: number) => void,
    specs: Specialty[],
  ): void {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const dx   = e.clientX - rect.left - cx;
      const dy   = e.clientY - rect.top  - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < innerR || dist > outerR + 8) {
        if (this.donutHover !== -1) {
          this.donutHover = -1;
          this.zone.run(() => this.donutTooltip.set(null));
          draw(1);
        }
        return;
      }
      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;
      let a = -Math.PI / 2, found = -1;
      for (let i = 0; i < specs.length; i++) {
        const sweep = (specs[i].pct / total) * 2 * Math.PI;
        if (angle >= a && angle < a + sweep) { found = i; break; }
        a += sweep;
      }
      if (found !== this.donutHover) {
        this.donutHover = found;
        this.zone.run(() => {
          if (found >= 0) {
            const sp = specs[found];
            this.donutTooltip.set({ label: sp.label, pct: sp.pct, count: sp.count, color: sp.color });
          } else {
            this.donutTooltip.set(null);
          }
        });
        draw(1);
      }
    });
    canvas.addEventListener('mouseleave', () => {
      this.donutHover = -1;
      this.zone.run(() => this.donutTooltip.set(null));
      draw(1);
    });
  }

  /* ══════════════════════════════════
     BAR CHART — animated rise
  ══════════════════════════════════ */
  private animateBarChart(data: { label: string; raw: number }[]): void {
    const canvas = this.barRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    cancelAnimationFrame(this.barRafId);

    const DPR     = Math.min(window.devicePixelRatio || 1, 2);
    /* Use parentElement width so canvas stretches correctly inside flex/grid */
    const W       = (canvas.parentElement?.clientWidth || canvas.offsetWidth || 560);
    const H       = 220;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);

    const PAD_T = 28, PAD_B = 36, PAD_L = 10, PAD_R = 10;
    const chartH = H - PAD_T - PAD_B;
    const chartW = W - PAD_L - PAD_R;
    const n      = data.length;
    const max    = Math.max(...data.map(d => d.raw));
    const barW   = Math.min(36, (chartW / n) * 0.55);
    const slot   = chartW / n;

    const DURATION = 750;
    let startTime: number | null = null;
    const easeOutBack = (t: number) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, W, H);

      /* grid lines */
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 0.6;
      const steps = 4;
      for (let i = 0; i <= steps; i++) {
        const y = PAD_T + (chartH / steps) * i;
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.moveTo(PAD_L, y);
        ctx.lineTo(W - PAD_R, y);
        ctx.stroke();

        const val = Math.round(max * (1 - i / steps));
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(123,145,176,0.7)';
        ctx.font = `500 9px Inter, system-ui`;
        ctx.textAlign = 'right';
        ctx.fillText(this.formatChartVal(val), PAD_L + 34, y + 3);
        ctx.setLineDash([4, 6]);
      }
      ctx.setLineDash([]);

      data.forEach((d, i) => {
        const targetH  = (d.raw / max) * chartH;
        const animH    = targetH * Math.min(progress, 1);
        const x        = PAD_L + slot * i + slot / 2;
        const barLeft  = x - barW / 2;
        const barTop   = PAD_T + chartH - animH;
        const isHov    = i === this.barHover;

        /* bar glow shadow */
        if (progress >= 1 && isHov) {
          ctx.shadowColor = '#14c8c7';
          ctx.shadowBlur  = 16;
        }

        /* gradient fill */
        const grad = ctx.createLinearGradient(barLeft, barTop, barLeft, PAD_T + chartH);
        if (isHov) {
          grad.addColorStop(0, '#5eead4');
          grad.addColorStop(1, '#0891b2');
        } else {
          grad.addColorStop(0, '#14c8c7');
          grad.addColorStop(1, '#0369a1');
        }

        const radius = Math.min(6, barW / 2);
        ctx.beginPath();
        ctx.moveTo(barLeft + radius, barTop);
        ctx.lineTo(barLeft + barW - radius, barTop);
        ctx.quadraticCurveTo(barLeft + barW, barTop, barLeft + barW, barTop + radius);
        ctx.lineTo(barLeft + barW, PAD_T + chartH);
        ctx.lineTo(barLeft, PAD_T + chartH);
        ctx.lineTo(barLeft, barTop + radius);
        ctx.quadraticCurveTo(barLeft, barTop, barLeft + radius, barTop);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.shadowBlur = 0;

        /* value label on top */
        if (progress >= 0.9) {
          const alpha = Math.min(1, (progress - 0.9) / 0.1);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = isHov ? '#5eead4' : 'rgba(232,240,254,0.9)';
          ctx.font = `700 10px Inter, system-ui`;
          ctx.textAlign = 'center';
          ctx.fillText(this.formatChartVal(d.raw), x, barTop - 6);
          ctx.globalAlpha = 1;
        }

        /* x-axis label */
        ctx.fillStyle = isHov ? '#5eead4' : 'rgba(123,145,176,0.85)';
        ctx.font = `500 9.5px Inter, system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(d.label, x, H - PAD_B + 16);
      });

      /* baseline */
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(PAD_L, PAD_T + chartH);
      ctx.lineTo(W - PAD_R, PAD_T + chartH);
      ctx.stroke();
    };

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const t = Math.min((ts - startTime) / DURATION, 1);
      draw(easeOutBack(Math.min(t, 1)));
      if (t < 1) {
        this.barRafId = requestAnimationFrame(tick);
      } else {
        draw(1);
        this.setupBarHover(canvas, data, max, slot, barW, PAD_L, PAD_T, PAD_B, chartH, draw);
      }
    };

    this.zone.runOutsideAngular(() => {
      this.barRafId = requestAnimationFrame(tick);
    });
  }

  private setupBarHover(
    canvas: HTMLCanvasElement,
    data: { label: string; raw: number }[],
    max: number, slot: number, barW: number,
    PAD_L: number, PAD_T: number, PAD_B: number, chartH: number,
    draw: (p: number) => void
  ): void {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx   = e.clientX - rect.left;
      const my   = e.clientY - rect.top;
      let found  = -1;
      data.forEach((d, i) => {
        const x       = PAD_L + slot * i + slot / 2;
        const barLeft = x - barW / 2;
        const targetH = (d.raw / max) * chartH;
        const barTop  = PAD_T + chartH - targetH;
        if (mx >= barLeft - 4 && mx <= barLeft + barW + 4 && my >= barTop - 4 && my <= PAD_T + chartH) {
          found = i;
        }
      });
      if (found !== this.barHover) { this.barHover = found; draw(1); }
    });
    canvas.addEventListener('mouseleave', () => { this.barHover = -1; draw(1); });
  }

  private formatChartVal(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }
}
