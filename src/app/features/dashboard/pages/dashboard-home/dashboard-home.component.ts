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
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CacheService } from '../../../../core/services/cache.service';
import { DashboardStats } from '../../models/dashboard.model';

interface CardStat {
  label: string;
  value: number;
  valueToday: number;
  icon: string;
  gradient: string;
  isCurrency: boolean;
}

interface RevBar {
  label: string;
  raw: number;
  pct: number;
}

interface Booking {
  id: string;
  patient: string;
  doctor: string;
  time: string;
  status: string;
  statusClass: string;
}

interface ActivityItem {
  id: number;
  icon: string;
  iconColor: string;
  bgColor: string;
  nodeColor: string;
  text: string;
  time: string;
  typeLabel: string;
  typeClass: string;
}

interface Specialty {
  label: string;
  pct: number;
  color: string;
}

const MONTHLY_DATA = [
  { label: 'نوفمبر', raw: 280 },
  { label: 'ديسمبر', raw: 310 },
  { label: 'يناير',  raw: 295 },
  { label: 'فبراير', raw: 340 },
  { label: 'مارس',   raw: 380 },
  { label: 'أبريل',  raw: 410 },
  { label: 'مايو',   raw: 450 },
  { label: 'يونيو',  raw: 487 },
];

const WEEKLY_DATA = [
  { label: 'السبت', raw: 62 },
  { label: 'الأحد', raw: 78 },
  { label: 'الاثنين', raw: 91 },
  { label: 'الثلاثاء', raw: 85 },
  { label: 'الأربعاء', raw: 110 },
  { label: 'الخميس', raw: 98 },
  { label: 'الجمعة', raw: 43 },
];

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

  protected readonly loading    = signal(false);
  protected readonly cardStats  = signal<CardStat[]>([]);
  protected readonly lastUpdate = signal<Date | null>(null);
  protected readonly revBars    = signal<RevBar[]>([]);

  private rafId      = 0;
  private barRafId   = 0;
  private donutHover = -1;
  private barHover   = -1;
  private currentBarData: { label: string; raw: number }[] = [];

  constructor() {
    /* React to loading becoming false — canvases are now in the DOM */
    effect(() => {
      if (!this.loading()) {
        /* Two rAF ticks: first lets Angular flush the @else block, second ensures layout */
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.animateDonut();
            this.animateBarChart(this.currentBarData);
          });
        });
      }
    });
  }

  readonly specialties: Specialty[] = [
    { label: 'القلب',    pct: 28, color: '#0EA5E9' },
    { label: 'باطنية',  pct: 22, color: '#14B8A6' },
    { label: 'الأطفال', pct: 18, color: '#22C55E' },
    { label: 'الأسنان', pct: 14, color: '#A78BFA' },
    { label: 'أخرى',    pct: 18, color: '#F59E0B' },
  ];

  readonly recentBookings: Booking[] = [
    { id: 'BK-4820', patient: 'كريم سعيد',    doctor: 'د. أحمد الشرقاوي', time: 'اليوم — 10:30 ص', status: 'مؤكّد',         statusClass: 'db-status--blue'  },
    { id: 'BK-4819', patient: 'سارة محمود',   doctor: 'د. ليلى حسّان',    time: 'اليوم — 9:00 ص',  status: 'مكتمل',        statusClass: 'db-status--teal'  },
    { id: 'BK-4818', patient: 'منى العزيز',   doctor: 'د. أحمد الشرقاوي', time: 'اليوم — 11:00 ص', status: 'قيد الانتظار', statusClass: 'db-status--amber' },
    { id: 'BK-4817', patient: 'محمد السيد',   doctor: 'د. سارة نور',      time: 'اليوم — 8:30 ص',  status: 'مكتمل',        statusClass: 'db-status--teal'  },
    { id: 'BK-4816', patient: 'يوسف حمدي',   doctor: 'د. منى عادل',      time: 'اليوم — 2:00 م',  status: 'مؤكّد',         statusClass: 'db-status--blue'  },
    { id: 'BK-4815', patient: 'خالد مصطفى',  doctor: 'د. أحمد الشرقاوي', time: 'اليوم — 3:30 م',  status: 'ملغى',          statusClass: 'db-status--red'   },
  ];

  readonly activityLog: ActivityItem[] = [
    { id: 1, icon: 'fa-check', iconColor: '#fff', nodeColor: '#22c55e', bgColor: 'rgba(34,197,94,.1)',    text: 'د. سارة نور — قبلت موعد BK-4818', time: 'منذ 3 دق',    typeLabel: 'قبول',   typeClass: 'db-atype--green'  },
    { id: 2, icon: 'fa-user-plus',       iconColor: '#fff', nodeColor: '#0ea5e9', bgColor: 'rgba(14,165,233,.1)',   text: 'مريض جديد: منى العزيز تسجّلت',             time: 'منذ 12 دق',   typeLabel: 'مريض',   typeClass: 'db-atype--blue'   },
    { id: 3, icon: 'fa-pills',           iconColor: '#fff', nodeColor: '#14b8a6', bgColor: 'rgba(20,184,166,.1)',   text: 'وصفة RX-0043 أُرسلت لصيدلية النور',        time: 'منذ 28 دق',   typeLabel: 'وصفة',   typeClass: 'db-atype--teal'   },
    { id: 4, icon: 'fa-user-doctor',     iconColor: '#fff', nodeColor: '#a78bfa', bgColor: 'rgba(167,139,250,.1)',  text: 'د. ياسر فريد قدّم طلب تسجيل',             time: 'منذ 45 دق',   typeLabel: 'طبيب',   typeClass: 'db-atype--purple' },
    { id: 5, icon: 'fa-calendar-xmark',  iconColor: '#fff', nodeColor: '#ef4444', bgColor: 'rgba(239,68,68,.1)',    text: 'إلغاء حجز BK-4815 — خالد مصطفى',          time: 'منذ ساعة',    typeLabel: 'إلغاء',  typeClass: 'db-atype--red'    },
    { id: 6, icon: 'fa-money-bill-wave', iconColor: '#fff', nodeColor: '#f59e0b', bgColor: 'rgba(245,158,11,.1)',   text: 'دفعة 18,400 ج.م — د. أحمد الشرقاوي',      time: 'منذ ساعتين',  typeLabel: 'دفعة',   typeClass: 'db-atype--amber'  },
  ];

  ngOnInit(): void {
    this.currentBarData = MONTHLY_DATA;
    this.buildRevBars(MONTHLY_DATA);
    this.load();
  }

  ngAfterViewInit(): void { /* charts triggered via effect() in constructor */ }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    cancelAnimationFrame(this.barRafId);
  }

  load(): void {
    this.loading.set(true);
    this.svc.getStats().subscribe({
      next: (stats) => {
        this.buildCards(stats);
        this.lastUpdate.set(new Date());
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('فشل في جلب بيانات لوحة التحكم');
        this.loading.set(false);
      },
    });
  }

  refresh(): void {
    this.cache.invalidate('Dashboard');
    this.load();
  }

  setRevView(mode: 'month' | 'week', e: Event): void {
    const btns = (e.target as HTMLElement).closest('.db-pill-toggle')?.querySelectorAll('.db-ptoggle-btn');
    btns?.forEach(b => b.classList.remove('active'));
    (e.target as HTMLElement).classList.add('active');
    const data = mode === 'month' ? MONTHLY_DATA : WEEKLY_DATA;
    this.currentBarData = data;
    this.buildRevBars(data);
    this.animateBarChart(data);
  }


  private buildRevBars(data: { label: string; raw: number }[]): void {
    const max = Math.max(...data.map(d => d.raw));
    this.revBars.set(data.map(d => ({
      label: d.label,
      raw: d.raw,
      pct: Math.round((d.raw / max) * 100),
    })));
  }

  private buildCards(stats: DashboardStats): void {
    this.cardStats.set([
      {
        label:      'المواعيد',
        value:      stats.totalAppointments,
        valueToday: stats.todayAppointments,
        icon:       'fa-calendar-check',
        gradient:   'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
        isCurrency: false,
      },
      {
        label:      'المرضى',
        value:      stats.totalPatients,
        valueToday: stats.todayPatients,
        icon:       'fa-users',
        gradient:   'linear-gradient(135deg,#14c8c7 0%,#0891b2 100%)',
        isCurrency: false,
      },
      {
        label:      'الأرباح',
        value:      stats.totalProfit,
        valueToday: stats.profitToday,
        icon:       'fa-circle-dollar-to-slot',
        gradient:   'linear-gradient(135deg,#f6d365 0%,#fda085 100%)',
        isCurrency: true,
      },
    ]);
  }

  /* ══════════════════════════════════
     DONUT CHART — animated sweep
  ══════════════════════════════════ */
  private animateDonut(): void {
    const canvas = this.donutRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR   = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE  = 200;
    canvas.width  = SIZE * DPR;
    canvas.height = SIZE * DPR;
    canvas.style.width  = SIZE + 'px';
    canvas.style.height = SIZE + 'px';
    ctx.scale(DPR, DPR);

    const cx = 100, cy = 100, outerR = 86, innerR = 54;
    const GAP   = 0.025;
    const total = this.specialties.reduce((s, sp) => s + sp.pct, 0);
    const DURATION = 900;
    let startTime: number | null = null;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      let angle = -Math.PI / 2;
      this.specialties.forEach((sp, i) => {
        const fullSweep  = (sp.pct / total) * 2 * Math.PI;
        const animSweep  = fullSweep * progress;
        const sweep      = Math.max(0, animSweep - GAP);
        if (sweep <= 0) { angle += animSweep; return; }

        const isHovered  = i === this.donutHover;
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

        if (isHovered) {
          ctx.shadowColor = sp.color;
          ctx.shadowBlur  = 18;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        angle += animSweep;
      });

      /* center glow */
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
        this.setupDonutHover(canvas, cx, cy, outerR, innerR, GAP, total, draw);
      }
    };

    this.zone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(tick);
    });
  }

  private setupDonutHover(
    canvas: HTMLCanvasElement,
    cx: number, cy: number,
    outerR: number, innerR: number,
    GAP: number, total: number,
    draw: (p: number) => void
  ): void {
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left);
      const my = (e.clientY - rect.top);
      const dx = mx - cx, dy = my - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < innerR || dist > outerR + 8) {
        if (this.donutHover !== -1) { this.donutHover = -1; draw(1); }
        return;
      }
      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;
      const startAngle = -Math.PI / 2;
      let a = startAngle;
      let found = -1;
      for (let i = 0; i < this.specialties.length; i++) {
        const sweep = (this.specialties[i].pct / total) * 2 * Math.PI;
        if (angle >= a && angle < a + sweep) { found = i; break; }
        a += sweep;
      }
      if (found !== this.donutHover) { this.donutHover = found; draw(1); }
    });
    canvas.addEventListener('mouseleave', () => {
      this.donutHover = -1; draw(1);
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
        ctx.fillText(val + 'K', PAD_L + 26, y + 3);
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
          ctx.fillText(d.raw + 'K', x, barTop - 6);
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
}
