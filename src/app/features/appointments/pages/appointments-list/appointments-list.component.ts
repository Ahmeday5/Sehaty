import {
  ChangeDetectionStrategy, Component, OnInit,
  inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AppointmentsService } from '../../services/appointments.service';
import {
  AppointmentItem,
  AppointmentStatusOption,
  APPOINTMENT_STATUS_VARIANT,
} from '../../models/appointment.model';
import { StatBadgeComponent } from '../../../../shared/components/stat-badge/stat-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    StatBadgeComponent,
    EmptyStateComponent, PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appointments-list.component.html',
  styleUrl: './appointments-list.component.scss',
})
export class AppointmentsListComponent implements OnInit {
  private readonly svc = inject(AppointmentsService);

  protected readonly loading      = signal(false);
  protected readonly currentPage  = signal(1);
  protected readonly totalPages   = signal(0);
  protected readonly totalCount   = signal(0);
  protected readonly displayed    = signal<AppointmentItem[]>([]);
  protected readonly statusOptions = signal<AppointmentStatusOption[]>([]);

  protected doctorSearch  = '';
  protected patientSearch = '';
  protected statusFilter  = '';
  protected dateFilter    = '';

  private readonly doctorSearch$  = new Subject<string>();
  private readonly patientSearch$ = new Subject<string>();

  protected readonly statusVariant = APPOINTMENT_STATUS_VARIANT;

  ngOnInit(): void {
    this.loadStatuses();
    this.loadPage(1);

    this.doctorSearch$.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => this.loadPage(1));

    this.patientSearch$.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => this.loadPage(1));
  }

  protected onDoctorSearch(val: string): void {
    this.doctorSearch = val;
    this.doctorSearch$.next(val);
  }

  protected onPatientSearch(val: string): void {
    this.patientSearch = val;
    this.patientSearch$.next(val);
  }

  protected onStatusChange(val: string): void {
    this.statusFilter = val;
    this.loadPage(1);
  }

  protected onDateChange(val: string): void {
    this.dateFilter = val;
    this.loadPage(1);
  }

  protected onPageChange(page: number): void { this.loadPage(page); }

  protected refresh(): void { this.loadPage(this.currentPage()); }

  protected statusLabelOf(status: string): string {
    const opt = this.statusOptions().find((o) => o.value === status);
    return opt?.label ?? status;
  }

  protected statusVariantOf(status: string): string {
    return APPOINTMENT_STATUS_VARIANT[status] ?? 'default';
  }

  private loadStatuses(): void {
    this.svc.getStatuses().subscribe({
      next: (opts) => this.statusOptions.set(opts),
    });
  }

  private loadPage(page: number): void {
    this.loading.set(true);
    this.currentPage.set(page);

    this.svc.getAppointments({
      doctorName:  this.doctorSearch  || undefined,
      patientName: this.patientSearch || undefined,
      status:      this.statusFilter  || null,
      date:        this.dateFilter    || null,
      page,
      pageSize: PAGE_SIZE,
    }).subscribe({
      next: (res) => {
        this.displayed.set(res.data);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(Math.ceil(res.totalCount / PAGE_SIZE));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
