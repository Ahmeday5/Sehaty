import {
  ChangeDetectionStrategy, Component, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrescriptionsService } from '../../services/prescriptions.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  Prescription, PrescriptionSource, PrescriptionStatus,
  PRESCRIPTION_STATUS_LABEL, PRESCRIPTION_STATUS_VARIANT,
  PRESCRIPTION_SOURCE_LABEL, PRESCRIPTION_SOURCE_VARIANT,
} from '../../models/prescription.model';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { StatBadgeComponent } from '../../../../shared/components/stat-badge/stat-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';

const PAGE_SIZE = 15;

@Component({
  selector: 'app-prescriptions-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    KpiStripComponent, StatBadgeComponent,
    EmptyStateComponent, PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './prescriptions-list.component.html',
  styleUrl: './prescriptions-list.component.scss',
})
export class PrescriptionsListComponent implements OnInit {
  private readonly svc   = inject(PrescriptionsService);
  private readonly toast = inject(ToastService);

  protected readonly loading       = signal(false);
  protected readonly currentPage   = signal(1);
  protected readonly totalPages    = signal(0);
  protected readonly displayed     = signal<Prescription[]>([]);
  protected readonly statusFilter  = signal<PrescriptionStatus | null>(null);
  protected readonly sourceFilter  = signal<PrescriptionSource | null>(null);

  protected searchValue = '';

  protected allPrescriptions: Prescription[] = [];
  protected filteredPrescriptions: Prescription[] = [];

  protected readonly statusLabel   = PRESCRIPTION_STATUS_LABEL;
  protected readonly sourceLabel   = PRESCRIPTION_SOURCE_LABEL;

  protected readonly STATUS_OPTIONS: { value: PrescriptionStatus | null; label: string }[] = [
    { value: null,        label: 'جميع الحالات' },
    { value: 'New',       label: 'قيد الانتظار' },
    { value: 'Dispensed', label: 'صُرفت'         },
    { value: 'Rejected',  label: 'مرفوضة'        },
  ];

  protected readonly SOURCE_OPTIONS: { value: PrescriptionSource | null; label: string }[] = [
    { value: null,     label: 'جميع المصادر'    },
    { value: 'App',    label: 'من التطبيق'      },
    { value: 'Doctor', label: 'من الطبيب'       },
  ];

  protected get totalCount():     number { return this.allPrescriptions.length; }
  protected get newCount():       number { return this.allPrescriptions.filter((p) => p.status === 'New').length; }
  protected get dispensedCount(): number { return this.allPrescriptions.filter((p) => p.status === 'Dispensed').length; }
  protected get rejectedCount():  number { return this.allPrescriptions.filter((p) => p.status === 'Rejected').length; }

  protected readonly kpiItems = computed<KpiItem[]>(() => {
    const _ = this.displayed();
    return [
      { icon: 'fa-file-prescription', value: String(this.totalCount),     label: 'إجمالي الوصفات', variant: 'primary' },
      { icon: 'fa-clock',             value: String(this.newCount),        label: 'قيد الانتظار',   variant: 'amber'   },
      { icon: 'fa-pills',             value: String(this.dispensedCount),  label: 'صُرفت',           variant: 'green'   },
      { icon: 'fa-circle-xmark',      value: String(this.rejectedCount),   label: 'مرفوضة',         variant: 'red'     },
    ];
  });

  ngOnInit(): void { this.loadAll(); }

  protected onSearch(val: string): void { this.searchValue = val; this.applyFilters(); }
  protected onStatusChange(val: string): void { this.statusFilter.set(val ? val as PrescriptionStatus : null); this.applyFilters(); }
  protected onSourceChange(val: string): void { this.sourceFilter.set(val ? val as PrescriptionSource : null); this.applyFilters(); }
  protected onPageChange(page: number): void { this.currentPage.set(page); this.updatePage(); }
  protected refresh(): void { this.svc.invalidate(); this.loadAll(); }

  protected statusVariantOf(s: PrescriptionStatus): string { return PRESCRIPTION_STATUS_VARIANT[s] ?? 'default'; }
  protected statusLabelOf(s: PrescriptionStatus): string   { return PRESCRIPTION_STATUS_LABEL[s] ?? s; }
  protected sourceVariantOf(s: PrescriptionSource): string { return PRESCRIPTION_SOURCE_VARIANT[s] ?? 'default'; }
  protected sourceLabelOf(s: PrescriptionSource): string   { return PRESCRIPTION_SOURCE_LABEL[s] ?? s; }

  private loadAll(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (data) => { this.allPrescriptions = data; this.applyFilters(); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private applyFilters(): void {
    let list = [...this.allPrescriptions];
    const sf = this.statusFilter();
    const src = this.sourceFilter();
    if (sf)  list = list.filter((p) => p.status === sf);
    if (src) list = list.filter((p) => p.source === src);
    if (this.searchValue.trim()) {
      const q = this.searchValue.trim().toLowerCase();
      list = list.filter((p) =>
        p.patientName.toLowerCase().includes(q) ||
        p.doctorName.toLowerCase().includes(q) ||
        p.prescriptionNumber.toLowerCase().includes(q) ||
        p.medications.toLowerCase().includes(q),
      );
    }
    this.filteredPrescriptions = list;
    this.totalPages.set(Math.ceil(list.length / PAGE_SIZE));
    this.currentPage.set(1);
    this.updatePage();
  }

  private updatePage(): void {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    this.displayed.set(this.filteredPrescriptions.slice(start, start + PAGE_SIZE));
  }
}
