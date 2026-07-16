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
import { AuditService, ADMIN_NAMES } from '../../services/audit.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import {
  AuditKpiSummary,
  ActiveSession,
  AuditLogEntry,
  AuditFilter,
  AuditRiskLevel,
} from '../../models/audit.model';

const DEFAULT_LOG_PAGE_SIZE = 10;

@Component({
  selector: 'app-audit-home',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiStripComponent, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './audit-home.component.html',
  styleUrl: './audit-home.component.scss',
})
export class AuditHomeComponent implements OnInit {
  private readonly svc     = inject(AuditService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  // ── Loading ──────────────────────────────────────────────────────────────────
  protected readonly loadingKpi      = signal(true);
  protected readonly loadingSessions = signal(true);
  protected readonly loadingLog      = signal(true);

  // ── Data ─────────────────────────────────────────────────────────────────────
  protected readonly kpiSummary  = signal<AuditKpiSummary | null>(null);
  protected readonly sessions    = signal<ActiveSession[]>([]);
  protected readonly lastUpdate  = signal<Date | null>(null);
  protected readonly terminatingId = signal<number | null>(null);

  protected readonly adminNames = ADMIN_NAMES;

  private allLog: AuditLogEntry[] = [];
  protected _filteredLog: AuditLogEntry[] = [];

  // ── Filter ───────────────────────────────────────────────────────────────────
  protected readonly filter = signal<AuditFilter>({
    eventType: 'all',
    adminName: 'all',
    dateFrom:  '',
    search:    '',
  });

  // ── Pagination ───────────────────────────────────────────────────────────────
  protected readonly currentPage = signal(1);
  protected readonly pageSize    = signal(DEFAULT_LOG_PAGE_SIZE);
  protected readonly displayed   = signal<AuditLogEntry[]>([]);

  // ── KPI strip ────────────────────────────────────────────────────────────────
  protected readonly kpiItems = computed<KpiItem[]>(() => {
    const s = this.kpiSummary();
    return [
      { icon: 'fa-circle-nodes',    value: s ? String(s.activeSessionsCount) : '—', label: 'جلسات نشطة الآن',        variant: 'green'   },
      { icon: 'fa-bolt',            value: s ? String(s.actionsToday)         : '—', label: 'إجراءات اليوم',          variant: 'primary' },
      { icon: 'fa-triangle-exclamation', value: s ? String(s.failedLoginsToday)   : '—', label: 'محاولات دخول فاشلة',    variant: 'amber'   },
      { icon: 'fa-shield-halved',   value: s ? String(s.sensitiveEditsToday)  : '—', label: 'تعديلات حساسة',          variant: 'red'     },
    ];
  });

  ngOnInit(): void {
    this.loadAll();
  }

  // ── Filter handlers ───────────────────────────────────────────────────────
  protected onEventTypeChange(val: string): void {
    this.filter.update((f) => ({ ...f, eventType: val as AuditFilter['eventType'] }));
    this.applyFilter();
  }

  protected onAdminChange(val: string): void {
    this.filter.update((f) => ({ ...f, adminName: val }));
    this.applyFilter();
  }

  protected onDateChange(val: string): void {
    this.filter.update((f) => ({ ...f, dateFrom: val }));
    this.applyFilter();
  }

  protected onSearch(q: string): void {
    this.filter.update((f) => ({ ...f, search: q }));
    this.applyFilter();
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.updatePage();
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.updatePage();
  }

  // ── Terminate session ─────────────────────────────────────────────────────
  protected async terminateSession(session: ActiveSession): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'إنهاء الجلسة',
      message:     `هل تريد إنهاء جلسة "${session.adminName}"؟`,
      confirmText: 'إنهاء',
      type:        'danger',
    });
    if (!ok) return;

    this.terminatingId.set(session.id);
    this.svc.terminateSession(session.id).subscribe({
      next: (msg) => {
        this.toast.success(msg);
        this.sessions.update((list) => list.filter((s) => s.id !== session.id));
        this.terminatingId.set(null);
        this.reloadKpi();
      },
      error: () => {
        this.toast.error('فشل إنهاء الجلسة');
        this.terminatingId.set(null);
      },
    });
  }

  // ── Refresh ───────────────────────────────────────────────────────────────
  protected refresh(): void { this.loadAll(); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  protected riskLabel(r: AuditRiskLevel): string {
    return r === 'high' ? 'عالي' : r === 'medium' ? 'متوسط' : 'منخفض';
  }

  protected riskClass(r: AuditRiskLevel): string {
    return r === 'high' ? 'aud-risk--high' : r === 'medium' ? 'aud-risk--medium' : 'aud-risk--low';
  }

  protected isTerminating(id: number): boolean { return this.terminatingId() === id; }

  // ── Private ───────────────────────────────────────────────────────────────
  private loadAll(): void {
    this.reloadKpi();
    this.loadSessions();
    this.loadLog();
  }

  private reloadKpi(): void {
    this.loadingKpi.set(true);
    this.svc.getKpiSummary().subscribe({
      next: (d) => { this.kpiSummary.set(d); this.loadingKpi.set(false); this.lastUpdate.set(new Date()); },
      error: () => this.loadingKpi.set(false),
    });
  }

  private loadSessions(): void {
    this.loadingSessions.set(true);
    this.svc.getActiveSessions().subscribe({
      next: (d) => { this.sessions.set(d); this.loadingSessions.set(false); },
      error: () => this.loadingSessions.set(false),
    });
  }

  private loadLog(): void {
    this.loadingLog.set(true);
    this.svc.getAuditLog().subscribe({
      next: (d) => { this.allLog = d; this.applyFilter(); this.loadingLog.set(false); },
      error: () => this.loadingLog.set(false),
    });
  }

  private applyFilter(): void {
    const { eventType, adminName, search } = this.filter();
    let result = [...this.allLog];

    if (adminName !== 'all') result = result.filter((e) => e.adminName === adminName);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (e) => e.action.toLowerCase().includes(q) || e.target.toLowerCase().includes(q) || e.adminName.toLowerCase().includes(q),
      );
    }

    this._filteredLog = result;
    this.currentPage.set(1);
    this.updatePage();
  }

  private updatePage(): void {
    const size  = this.pageSize();
    const start = (this.currentPage() - 1) * size;
    this.displayed.set(this._filteredLog.slice(start, start + size));
  }
}
