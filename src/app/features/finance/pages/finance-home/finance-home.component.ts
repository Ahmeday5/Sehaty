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
import { FinanceService } from '../../services/finance.service';
import { ToastService } from '../../../../core/services/toast.service';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';
import {
  FinanceKpiSummary,
  DoctorRevenue,
  PendingPayment,
  FinanceTransaction,
  FinanceFilter,
  TransactionType,
  TransactionStatus,
  FinancePeriod,
} from '../../models/finance.model';

const ITEMS_PER_PAGE = 10;

@Component({
  selector: 'app-finance-home',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiStripComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './finance-home.component.html',
  styleUrl: './finance-home.component.scss',
})
export class FinanceHomeComponent implements OnInit {
  private readonly svc   = inject(FinanceService);
  private readonly toast = inject(ToastService);

  // ── Loading states ──────────────────────────────────────────────────────────
  protected readonly loadingKpi          = signal(true);
  protected readonly loadingDoctors      = signal(true);
  protected readonly loadingPending      = signal(true);
  protected readonly loadingTransactions = signal(true);

  // ── Data ────────────────────────────────────────────────────────────────────
  protected readonly kpiSummary    = signal<FinanceKpiSummary | null>(null);
  protected readonly topDoctors    = signal<DoctorRevenue[]>([]);
  protected readonly pendingList   = signal<PendingPayment[]>([]);
  protected readonly lastUpdate    = signal<Date | null>(null);

  private allTransactions: FinanceTransaction[] = [];

  // ── Filter & pagination ─────────────────────────────────────────────────────
  protected readonly filter = signal<FinanceFilter>({
    source: 'all',
    period: 'month',
    search: '',
  });
  protected readonly currentPage = signal(1);
  protected readonly totalPages  = signal(0);
  protected readonly displayed   = signal<FinanceTransaction[]>([]);

  // ── Settling ────────────────────────────────────────────────────────────────
  protected readonly settlingId  = signal<number | null>(null);
  protected readonly settlingAll = signal(false);

  // ── KPI strip items ──────────────────────────────────────────────────────────
  protected readonly kpiItems = computed<KpiItem[]>(() => {
    const s = this.kpiSummary();
    return [
      {
        icon:    'fa-money-bill-wave',
        value:   s ? this.formatCurrency(s.monthlyRevenue) : '—',
        label:   'إيرادات يونيو (ج.م)',
        variant: 'green',
      },
      {
        icon:    'fa-gift',
        value:   s ? this.formatCurrency(s.platformCommission) : '—',
        label:   'عمولة المنصة (10%)',
        variant: 'primary',
      },
      {
        icon:    'fa-clock',
        value:   s ? this.formatCurrency(s.pendingAmount) : '—',
        label:   'مدفوعات معلّقة (ج.م)',
        variant: 'amber',
      },
      {
        icon:    'fa-credit-card',
        value:   s ? s.totalTransactions.toLocaleString('ar-EG') : '—',
        label:   'إجمالي المعاملات',
        variant: 'purple',
      },
    ];
  });

  ngOnInit(): void {
    this.loadAll();
  }

  // ── Period toggle ────────────────────────────────────────────────────────────
  protected setPeriod(period: FinancePeriod): void {
    this.filter.update((f) => ({ ...f, period }));
    this.loadTopDoctors(period);
  }

  // ── Source filter ────────────────────────────────────────────────────────────
  protected onSourceChange(source: string): void {
    this.filter.update((f) => ({ ...f, source: source as FinanceFilter['source'] }));
    this.applyFilter();
  }

  // ── Search ───────────────────────────────────────────────────────────────────
  protected onSearch(query: string): void {
    this.filter.update((f) => ({ ...f, search: query }));
    this.applyFilter();
  }

  // ── Settle single ─────────────────────────────────────────────────────────
  protected settle(item: PendingPayment): void {
    this.settlingId.set(item.id);
    this.svc.settlePayment(item.id).subscribe({
      next: (msg) => {
        this.toast.success(msg);
        this.pendingList.update((list) => list.filter((p) => p.id !== item.id));
        this.settlingId.set(null);
        this.reloadKpi();
      },
      error: () => {
        this.toast.error('فشل إتمام التسوية');
        this.settlingId.set(null);
      },
    });
  }

  // ── Settle all ────────────────────────────────────────────────────────────
  protected settleAllPending(): void {
    this.settlingAll.set(true);
    this.svc.settleAll().subscribe({
      next: (msg) => {
        this.toast.success(msg);
        this.pendingList.set([]);
        this.settlingAll.set(false);
        this.reloadKpi();
      },
      error: () => {
        this.toast.error('فشل تسوية المدفوعات');
        this.settlingAll.set(false);
      },
    });
  }

  // ── Refresh ──────────────────────────────────────────────────────────────
  protected refresh(): void { this.loadAll(); }

  // ── Pagination ───────────────────────────────────────────────────────────
  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.updatePage();
  }

  protected get pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  protected formatCurrency(val: number): string {
    return val.toLocaleString('ar-EG');
  }

  protected typeLabel(type: TransactionType): string {
    const map: Record<TransactionType, string> = {
      booking:            'حجز',
      pharmacy:           'صيدلية',
      monthly_commission: 'عمولة شهرية',
    };
    return map[type];
  }

  protected typeBadgeClass(type: TransactionType): string {
    const map: Record<TransactionType, string> = {
      booking:            'badge-blue',
      pharmacy:           'badge-teal',
      monthly_commission: 'badge-purple',
    };
    return map[type];
  }

  protected statusLabel(status: TransactionStatus): string {
    const map: Record<TransactionStatus, string> = {
      completed: 'مكتملة',
      pending:   'معلّقة',
      failed:    'فاشلة',
      refunded:  'مُستردة',
    };
    return map[status];
  }

  protected statusBadgeClass(status: TransactionStatus): string {
    const map: Record<TransactionStatus, string> = {
      completed: 'badge-green',
      pending:   'badge-amber',
      failed:    'badge-red',
      refunded:  'badge-purple',
    };
    return map[status];
  }

  protected urgencyClass(urgency: PendingPayment['urgency']): string {
    return urgency === 'high' ? 'var(--red)' : urgency === 'medium' ? 'var(--amber)' : 'var(--primary)';
  }

  protected urgencyBg(urgency: PendingPayment['urgency']): string {
    return urgency === 'high' ? 'var(--redsoft)' : urgency === 'medium' ? 'var(--ambersoft)' : 'var(--main-light)';
  }

  protected isSettling(id: number): boolean {
    return this.settlingId() === id;
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private loadAll(): void {
    this.reloadKpi();
    this.loadTopDoctors(this.filter().period);
    this.loadPending();
    this.loadTransactions();
  }

  private reloadKpi(): void {
    this.loadingKpi.set(true);
    this.svc.getKpiSummary().subscribe({
      next: (data) => { this.kpiSummary.set(data); this.loadingKpi.set(false); this.lastUpdate.set(new Date()); },
      error: () => this.loadingKpi.set(false),
    });
  }

  private loadTopDoctors(period: FinancePeriod): void {
    this.loadingDoctors.set(true);
    this.svc.getTopDoctorsByRevenue(period).subscribe({
      next: (data) => { this.topDoctors.set(data); this.loadingDoctors.set(false); },
      error: () => this.loadingDoctors.set(false),
    });
  }

  private loadPending(): void {
    this.loadingPending.set(true);
    this.svc.getPendingPayments().subscribe({
      next: (data) => { this.pendingList.set(data); this.loadingPending.set(false); },
      error: () => this.loadingPending.set(false),
    });
  }

  private loadTransactions(): void {
    this.loadingTransactions.set(true);
    this.svc.getTransactions().subscribe({
      next: (data) => {
        this.allTransactions = data;
        this.applyFilter();
        this.loadingTransactions.set(false);
      },
      error: () => this.loadingTransactions.set(false),
    });
  }

  private applyFilter(): void {
    const { source, search } = this.filter();
    let filtered = [...this.allTransactions];

    if (source !== 'all') {
      const typeMap: Record<string, TransactionType> = {
        booking:    'booking',
        pharmacy:   'pharmacy',
        commission: 'monthly_commission',
      };
      filtered = filtered.filter((t) => t.type === typeMap[source]);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.partyName.toLowerCase().includes(q) ||
          t.patientName?.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q),
      );
    }

    this.totalPages.set(Math.ceil(filtered.length / ITEMS_PER_PAGE));
    this.currentPage.set(1);
    this.allTransactions = this.allTransactions;
    this.displayed.set(filtered.slice(0, ITEMS_PER_PAGE));

    // Store filtered for pagination
    this._filtered = filtered;
  }

  private _filtered: FinanceTransaction[] = [];

  private updatePage(): void {
    const start = (this.currentPage() - 1) * ITEMS_PER_PAGE;
    this.displayed.set(this._filtered.slice(start, start + ITEMS_PER_PAGE));
  }
}
