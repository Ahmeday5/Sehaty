import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PharmacyPrescriptionsService } from '../../services/pharmacy-prescriptions.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  Prescription,
  PRESCRIPTION_STATUS_LABELS,
  PrescriptionCreateOrderRequest,
  PrescriptionReviewRequest,
  PrescriptionStatus,
} from '../../models/prescription.model';
import { PrescriptionDetailsModalComponent } from '../../components/prescription-details-modal/prescription-details-modal.component';
import { PrescriptionCardComponent } from '../../components/prescription-card/prescription-card.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';
import { apiErrorMessageAr } from '../../utils/api-error-ar.util';

interface StatusFilterOption {
  value: PrescriptionStatus | undefined;
  label: string;
}

@Component({
  selector: 'app-pharmacy-prescriptions',
  standalone: true,
  imports: [
    CommonModule,
    PaginationComponent,
    EmptyStateComponent,
    KpiStripComponent,
    PrescriptionCardComponent,
    PrescriptionDetailsModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pharmacy-prescriptions.component.html',
  styleUrl: './pharmacy-prescriptions.component.scss',
})
export class PharmacyPrescriptionsComponent implements OnInit {
  private readonly svc   = inject(PharmacyPrescriptionsService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly PrescriptionStatus = PrescriptionStatus;

  protected readonly statusOptions: StatusFilterOption[] = [
    { value: undefined, label: 'الكل' },
    { value: PrescriptionStatus.Pending, label: PRESCRIPTION_STATUS_LABELS[PrescriptionStatus.Pending] },
    { value: PrescriptionStatus.Accepted, label: PRESCRIPTION_STATUS_LABELS[PrescriptionStatus.Accepted] },
    { value: PrescriptionStatus.Rejected, label: PRESCRIPTION_STATUS_LABELS[PrescriptionStatus.Rejected] },
  ];

  protected readonly loading      = signal(false);
  protected readonly prescriptions = signal<Prescription[]>([]);
  protected readonly total        = signal(0);
  protected readonly currentPage  = signal(1);
  protected readonly pageSize     = signal(10);
  protected readonly statusFilter = signal<PrescriptionStatus | undefined>(undefined);

  protected readonly selectedPrescription = signal<Prescription | null>(null);
  protected readonly detailsLoading = signal(false);
  protected readonly submitting     = signal(false);

  protected readonly kpiItems = computed<KpiItem[]>(() => {
    const list = this.prescriptions();
    const pendingCount = list.filter((p) => p.status === PrescriptionStatus.Pending).length;
    return [
      { icon: 'fa-file-prescription', value: String(this.total()), label: 'إجمالي الروشتات', variant: 'primary' },
      { icon: 'fa-hourglass-half', value: String(pendingCount), label: 'قيد المراجعة (بالصفحة الحالية)', variant: 'amber' },
    ];
  });

  ngOnInit(): void {
    // Supports deep-linking from the dashboard's "needs review" card (?status=0) —
    // falls back to the default "الكل" view when absent or invalid.
    const statusParam = this.route.snapshot.queryParamMap.get('status');
    if (statusParam !== null) {
      const parsed = Number(statusParam);
      if (Number.isInteger(parsed) && parsed in PrescriptionStatus) {
        this.statusFilter.set(parsed);
      }
    }
    this.load();
  }

  protected onStatusFilterChange(value: PrescriptionStatus | undefined): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.load();
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.load();
  }

  protected refresh(): void { this.load(); }

  protected async openPrescription(prescription: Prescription): Promise<void> {
    this.detailsLoading.set(true);
    try {
      const fresh = await firstValueFrom(this.svc.getPrescription(prescription.id));
      this.selectedPrescription.set(fresh);
    } catch {
      this.toast.error('فشل تحميل تفاصيل الروشتة');
    } finally {
      this.detailsLoading.set(false);
    }
  }

  protected closeModal(): void {
    this.selectedPrescription.set(null);
  }

  private patchPrescription(id: number, patch: Partial<Prescription>): void {
    const filter = this.statusFilter();
    if (patch.status !== undefined && filter !== undefined && patch.status !== filter) {
      this.prescriptions.update((list) => list.filter((p) => p.id !== id));
      this.total.update((t) => Math.max(0, t - 1));
    } else {
      this.prescriptions.update((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    }

    const current = this.selectedPrescription();
    if (current && current.id === id) {
      this.selectedPrescription.set({ ...current, ...patch });
    }
  }

  protected async onReview(req: PrescriptionReviewRequest): Promise<void> {
    this.submitting.set(true);
    try {
      await firstValueFrom(this.svc.reviewPrescription(req.prescription.id, {
        accept: req.accept,
        rejectionReason: req.rejectionReason,
      }));
      this.toast.success(req.accept ? 'تم قبول الروشتة بنجاح' : 'تم رفض الروشتة بنجاح');
      this.patchPrescription(req.prescription.id, {
        status: req.accept ? PrescriptionStatus.Accepted : PrescriptionStatus.Rejected,
        rejectionReason: req.accept ? null : (req.rejectionReason ?? null),
        reviewedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      this.toast.error(apiErrorMessageAr(err, 'فشل مراجعة الروشتة'));
    } finally {
      this.submitting.set(false);
    }
  }

  protected async onCreateOrder(req: PrescriptionCreateOrderRequest): Promise<void> {
    this.submitting.set(true);
    try {
      const res = await firstValueFrom(this.svc.createOrderFromPrescription(req.prescription.id, { items: req.items }));
      this.toast.success(`تم إنشاء الطلب #${res.orderId} من الروشتة بنجاح`);
      this.patchPrescription(req.prescription.id, { orderId: res.orderId });
    } catch (err: any) {
      this.toast.error(apiErrorMessageAr(err, 'فشل إنشاء الطلب من الروشتة'));
    } finally {
      this.submitting.set(false);
    }
  }

  private load(): void {
    this.loading.set(true);

    this.svc.getPrescriptions({
      page: this.currentPage(),
      pageSize: this.pageSize(),
      status: this.statusFilter(),
    }).subscribe({
      next: (res) => {
        this.prescriptions.set(res.data ?? []);
        this.total.set(res.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.prescriptions.set([]);
        this.total.set(0);
        this.loading.set(false);
        this.toast.error('فشل تحميل الروشتات');
      },
    });
  }
}
