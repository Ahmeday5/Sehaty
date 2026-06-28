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
import { ApprovalsService } from '../../services/approvals.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';
import {
  ApprovalKpiSummary,
  PendingApproval,
  ApprovalHistoryItem,
  ApprovalHistoryFilter,
} from '../../models/approvals.model';

const HISTORY_PER_PAGE = 8;

@Component({
  selector: 'app-approvals-home',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiStripComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './approvals-home.component.html',
  styleUrl: './approvals-home.component.scss',
})
export class ApprovalsHomeComponent implements OnInit {
  private readonly svc     = inject(ApprovalsService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  // ── Loading ──────────────────────────────────────────────────────────────────
  protected readonly loadingKpi     = signal(true);
  protected readonly loadingPending = signal(true);
  protected readonly loadingHistory = signal(true);

  // ── Data ─────────────────────────────────────────────────────────────────────
  protected readonly kpiSummary   = signal<ApprovalKpiSummary | null>(null);
  protected readonly pendingList  = signal<PendingApproval[]>([]);
  protected readonly lastUpdate   = signal<Date | null>(null);

  // ── In-flight action IDs ──────────────────────────────────────────────────
  protected readonly approvingId = signal<number | null>(null);
  protected readonly rejectingId = signal<number | null>(null);

  // ── History + filter ─────────────────────────────────────────────────────
  private allHistory: ApprovalHistoryItem[] = [];

  protected readonly histFilter = signal<ApprovalHistoryFilter>({
    decision: 'all',
    search:   '',
  });
  protected readonly histCurrentPage = signal(1);
  protected readonly histTotalPages  = signal(0);
  protected readonly histDisplayed   = signal<ApprovalHistoryItem[]>([]);

  private _filteredHistory: ApprovalHistoryItem[] = [];

  // ── KPI strip ────────────────────────────────────────────────────────────────
  protected readonly kpiItems = computed<KpiItem[]>(() => {
    const s = this.kpiSummary();
    return [
      {
        icon:    'fa-clock',
        value:   s ? String(s.pendingCount) : '—',
        label:   'بانتظار المراجعة',
        variant: 'amber',
      },
      {
        icon:    'fa-circle-check',
        value:   s ? String(s.approvedThisMonth) : '—',
        label:   'تمت الموافقة (الشهر)',
        variant: 'green',
      },
      {
        icon:    'fa-circle-xmark',
        value:   s ? String(s.rejectedThisMonth) : '—',
        label:   'مرفوضة (الشهر)',
        variant: 'red',
      },
      {
        icon:    'fa-chart-pie',
        value:   s ? `${s.acceptanceRate}%` : '—',
        label:   'معدل القبول',
        variant: 'primary',
      },
    ];
  });

  // ── Pagination pages array ────────────────────────────────────────────────
  protected get histPages(): number[] {
    return Array.from({ length: this.histTotalPages() }, (_, i) => i + 1);
  }

  ngOnInit(): void {
    this.loadAll();
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  protected async onApprove(item: PendingApproval): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'تأكيد القبول',
      message:     `هل تريد قبول طلب "${item.doctorName}"؟`,
      confirmText: 'قبول',
      type:        'info',
    });
    if (!ok) return;

    this.approvingId.set(item.id);
    this.svc.approveDoctor(item.id).subscribe({
      next: (msg) => {
        this.toast.success(msg);
        this.pendingList.update((list) => list.filter((p) => p.id !== item.id));
        this.approvingId.set(null);
        this.reloadKpi();
        this.reloadHistory();
      },
      error: () => {
        this.toast.error('فشل قبول الطلب');
        this.approvingId.set(null);
      },
    });
  }

  protected async onReject(item: PendingApproval): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'تأكيد الرفض',
      message:     `هل تريد رفض طلب "${item.doctorName}"؟ لا يمكن التراجع عن هذا القرار.`,
      confirmText: 'رفض',
      type:        'danger',
    });
    if (!ok) return;

    this.rejectingId.set(item.id);
    this.svc.rejectDoctor(item.id).subscribe({
      next: (msg) => {
        this.toast.success(msg);
        this.pendingList.update((list) => list.filter((p) => p.id !== item.id));
        this.rejectingId.set(null);
        this.reloadKpi();
        this.reloadHistory();
      },
      error: () => {
        this.toast.error('فشل رفض الطلب');
        this.rejectingId.set(null);
      },
    });
  }

  // ── History filter ─────────────────────────────────────────────────────────
  protected onDecisionFilter(decision: string): void {
    this.histFilter.update((f) => ({
      ...f,
      decision: decision as ApprovalHistoryFilter['decision'],
    }));
    this.applyHistFilter();
  }

  protected onHistSearch(query: string): void {
    this.histFilter.update((f) => ({ ...f, search: query }));
    this.applyHistFilter();
  }

  protected onHistPageChange(page: number): void {
    this.histCurrentPage.set(page);
    this.updateHistPage();
  }

  // ── Refresh ───────────────────────────────────────────────────────────────
  protected refresh(): void { this.loadAll(); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  protected isApproving(id: number): boolean { return this.approvingId() === id; }
  protected isRejecting(id: number): boolean { return this.rejectingId() === id; }

  protected isActionBusy(id: number): boolean {
    return this.approvingId() === id || this.rejectingId() === id;
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private loadAll(): void {
    this.reloadKpi();
    this.loadPending();
    this.reloadHistory();
  }

  private reloadKpi(): void {
    this.loadingKpi.set(true);
    this.svc.getKpiSummary().subscribe({
      next: (data) => {
        this.kpiSummary.set(data);
        this.loadingKpi.set(false);
        this.lastUpdate.set(new Date());
      },
      error: () => this.loadingKpi.set(false),
    });
  }

  private loadPending(): void {
    this.loadingPending.set(true);
    this.svc.getPendingApprovals().subscribe({
      next: (data) => { this.pendingList.set(data); this.loadingPending.set(false); },
      error: () => this.loadingPending.set(false),
    });
  }

  private reloadHistory(): void {
    this.loadingHistory.set(true);
    this.svc.getApprovalHistory().subscribe({
      next: (data) => {
        this.allHistory = data;
        this.applyHistFilter();
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false),
    });
  }

  private applyHistFilter(): void {
    const { decision, search } = this.histFilter();
    let filtered = [...this.allHistory];

    if (decision !== 'all') {
      filtered = filtered.filter((h) => h.decision === decision);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.doctorName.toLowerCase().includes(q) ||
          h.specialization.toLowerCase().includes(q) ||
          h.supervisor.toLowerCase().includes(q),
      );
    }

    this._filteredHistory = filtered;
    this.histTotalPages.set(Math.ceil(filtered.length / HISTORY_PER_PAGE));
    this.histCurrentPage.set(1);
    this.updateHistPage();
  }

  private updateHistPage(): void {
    const start = (this.histCurrentPage() - 1) * HISTORY_PER_PAGE;
    this.histDisplayed.set(this._filteredHistory.slice(start, start + HISTORY_PER_PAGE));
  }
}
