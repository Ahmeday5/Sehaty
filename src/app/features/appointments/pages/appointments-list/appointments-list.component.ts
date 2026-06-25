import {
  ChangeDetectionStrategy, Component, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService } from '../../services/appointments.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  Appointment, AppointmentStatus,
  APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_VARIANT,
} from '../../models/appointment.model';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { StatBadgeComponent } from '../../../../shared/components/stat-badge/stat-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';

const PAGE_SIZE = 15;

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    KpiStripComponent, StatBadgeComponent,
    EmptyStateComponent, PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appointments-list.component.html',
  styleUrl: './appointments-list.component.scss',
})
export class AppointmentsListComponent implements OnInit {
  private readonly svc     = inject(AppointmentsService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast   = inject(ToastService);

  protected readonly loading      = signal(false);
  protected readonly currentPage  = signal(1);
  protected readonly totalPages   = signal(0);
  protected readonly displayed    = signal<Appointment[]>([]);
  protected readonly statusFilter = signal<AppointmentStatus | null>(null);

  protected searchValue = '';

  protected allAppointments: Appointment[] = [];
  protected filteredAppointments: Appointment[] = [];

  protected readonly statusLabel   = APPOINTMENT_STATUS_LABEL;
  protected readonly statusVariant = APPOINTMENT_STATUS_VARIANT;

  protected readonly STATUS_OPTIONS: { value: AppointmentStatus | null; label: string }[] = [
    { value: null,        label: 'جميع الحالات'  },
    { value: 'Pending',   label: 'قيد الانتظار'  },
    { value: 'Confirmed', label: 'مؤكّد'          },
    { value: 'Completed', label: 'مكتمل'         },
    { value: 'Cancelled', label: 'ملغي'           },
  ];

  protected get todayCount():     number { return this.allAppointments.filter((a) => this.isToday(a.appointmentDate)).length; }
  protected get pendingCount():   number { return this.allAppointments.filter((a) => a.status === 'Pending').length; }
  protected get completedCount(): number { return this.allAppointments.filter((a) => a.status === 'Completed').length; }
  protected get cancelledCount(): number { return this.allAppointments.filter((a) => a.status === 'Cancelled').length; }

  protected readonly kpiItems = computed<KpiItem[]>(() => {
    const _ = this.displayed();
    return [
      { icon: 'fa-calendar-day',   value: String(this.todayCount),     label: 'حجوزات اليوم',    variant: 'primary' },
      { icon: 'fa-clock',          value: String(this.pendingCount),    label: 'قيد الانتظار',    variant: 'amber'   },
      { icon: 'fa-circle-check',   value: String(this.completedCount),  label: 'مكتملة',          variant: 'green'   },
      { icon: 'fa-circle-xmark',   value: String(this.cancelledCount),  label: 'ملغية',           variant: 'red'     },
    ];
  });

  ngOnInit(): void { this.loadAll(); }

  protected onSearch(val: string): void {
    this.searchValue = val;
    this.applyFilters();
  }

  protected onStatusChange(val: string): void {
    this.statusFilter.set(val ? val as AppointmentStatus : null);
    this.applyFilters();
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.updatePage();
  }

  protected refresh(): void { this.svc.invalidate(); this.loadAll(); }

  protected async onCancel(appt: Appointment): Promise<void> {
    if (appt.status === 'Cancelled' || appt.status === 'Completed') return;
    const ok = await this.confirm.confirm({
      title: 'إلغاء الحجز',
      message: `هل تريد إلغاء حجز "${appt.bookingNumber}" للمريض ${appt.patientName}؟`,
      confirmText: 'إلغاء الحجز',
      type: 'danger',
    });
    if (!ok) return;
    this.svc.cancel(appt.id).subscribe({
      next: () => { this.toast.success('تم إلغاء الحجز'); this.refresh(); },
      error: (e) => this.toast.error(e?.message ?? 'فشل إلغاء الحجز'),
    });
  }

  protected statusVariantOf(s: AppointmentStatus): string {
    return APPOINTMENT_STATUS_VARIANT[s] ?? 'default';
  }

  protected statusLabelOf(s: AppointmentStatus): string {
    return APPOINTMENT_STATUS_LABEL[s] ?? s;
  }

  private loadAll(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (data) => {
        this.allAppointments = data;
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private applyFilters(): void {
    let list = [...this.allAppointments];
    const sf = this.statusFilter();
    if (sf) list = list.filter((a) => a.status === sf);
    if (this.searchValue.trim()) {
      const q = this.searchValue.trim().toLowerCase();
      list = list.filter((a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.bookingNumber.toLowerCase().includes(q),
      );
    }
    this.filteredAppointments = list;
    this.totalPages.set(Math.ceil(list.length / PAGE_SIZE));
    this.currentPage.set(1);
    this.updatePage();
  }

  private updatePage(): void {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    this.displayed.set(this.filteredAppointments.slice(start, start + PAGE_SIZE));
  }

  private isToday(dateStr: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const n = new Date();
    return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }
}
