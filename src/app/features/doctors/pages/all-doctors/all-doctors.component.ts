import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DoctorsService } from '../../services/doctors.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { Doctor, DoctorsListParams } from '../../models/doctor.model';
import { Speciality } from '../../../specialities/models/speciality.model';
import { DoctorCardComponent } from '../../components/doctor-card/doctor-card.component';
import { DoctorFormComponent } from '../../components/doctor-form/doctor-form.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SearchFilterBarComponent } from '../../../../shared/components/search-filter-bar/search-filter-bar.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';
import { FilterOption } from '../../../../shared/components/search-filter-bar/search-filter-bar.model';

@Component({
  selector: 'app-all-doctors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DoctorCardComponent,
    DoctorFormComponent,
    ModalComponent,
    PaginationComponent,
    KpiStripComponent,
    EmptyStateComponent,
    SearchFilterBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './all-doctors.component.html',
  styleUrl: './all-doctors.component.scss',
})
export class AllDoctorsComponent implements OnInit {
  private readonly svc     = inject(DoctorsService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly cdr     = inject(ChangeDetectorRef);

  protected readonly loading        = signal(false);
  protected readonly specialities   = signal<Speciality[]>([]);
  protected readonly displayed      = signal<Doctor[]>([]);
  protected readonly total          = signal(0);
  protected readonly currentPage    = signal(1);
  protected readonly showAddModal   = signal(false);
  protected readonly editingDoctor  = signal<Doctor | null>(null);
  protected readonly lastUpdate     = signal<Date | null>(null);
  protected readonly activeFilter   = signal<string | null>(null);
  protected readonly activeStatus   = signal<boolean | undefined>(undefined);

  protected searchValue = '';
  private readonly search$ = new Subject<string>();

  protected readonly pageSize = signal(10);

  protected readonly kpiItems = computed<KpiItem[]>(() => [
    { icon: 'fa-user-doctor',  value: String(this.total()),           label: 'إجمالي الأطباء',  variant: 'primary' },
    { icon: 'fa-stethoscope',  value: String(this.specialities().length), label: 'التخصصات',    variant: 'blue'    },
  ]);

  protected readonly filterOpts = computed<FilterOption[]>(() => [
    { id: null, label: 'الكل' },
    ...this.specialities().map((s) => ({ id: s.name, label: s.name })),
  ]);

  ngOnInit(): void {
    this.svc.getAllSpecialities().subscribe({ next: (d) => this.specialities.set(d) });
    this.load();

    this.search$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((q) => {
      this.searchValue = q;
      this.currentPage.set(1);
      this.load();
    });
  }

  protected onSearch(query: string): void    { this.search$.next(query); }
  protected onFilterChange(id: string | null): void {
    this.activeFilter.set(id);
    this.currentPage.set(1);
    this.load();
  }

  protected onStatusFilter(val: boolean | undefined): void {
    this.activeStatus.set(val);
    this.currentPage.set(1);
    this.load();
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.load();
  }

  protected openAdd(): void  { this.showAddModal.set(true);  }
  protected closeAdd(): void { this.showAddModal.set(false); }
  protected openEdit(doctor: Doctor): void  { this.editingDoctor.set(doctor); }
  protected closeEdit(): void               { this.editingDoctor.set(null);   }

  protected onSaved(): void {
    this.showAddModal.set(false);
    this.editingDoctor.set(null);
    this.load();
  }

  protected refresh(): void { this.load(); }

  protected async onToggleActive(doctor: Doctor): Promise<void> {
    const action = doctor.isActive ? 'تعطيل' : 'تفعيل';
    const ok = await this.confirm.confirm({
      title:       `${action} الطبيب`,
      message:     `هل تريد ${action} الطبيب "${doctor.name}"؟`,
      confirmText: action,
      type:        doctor.isActive ? 'danger' : 'info',
    });
    if (!ok) return;
    const call$ = doctor.isActive
      ? this.svc.deactivateDoctor(doctor.id)
      : this.svc.activateDoctor(doctor.id);
    call$.subscribe({
      next:  () => { this.toast.success(`تم ${action} الطبيب`); this.load(); },
      error: (e) => this.toast.error(e?.message ?? `فشل ${action} الطبيب`),
    });
  }

  protected async onDeleteDoctor(doctor: Doctor): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'حذف الطبيب',
      message:     `هل أنت متأكد من حذف الطبيب "${doctor.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف نهائي',
      type:        'danger',
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.svc.deleteDoctor(doctor.id));
      this.toast.success('تم حذف الطبيب بنجاح');
      this.load();
    } catch {
      this.toast.error('فشل حذف الطبيب');
    }
  }

  private load(): void {
    this.loading.set(true);

    const params: DoctorsListParams = {
      page:     this.currentPage(),
      pageSize: this.pageSize(),
    };
    if (this.searchValue.trim())        params.name           = this.searchValue.trim();
    if (this.activeFilter())            params.specialization = this.activeFilter()!;
    if (this.activeStatus() !== undefined) params.isActive    = this.activeStatus();

    this.svc.getDoctors(params).subscribe({
      next: (res) => {
        this.displayed.set(res.data ?? []);
        this.total.set(res.total ?? 0);
        this.lastUpdate.set(new Date());
        this.loading.set(false);
      },
      error: () => {
        this.displayed.set([]);
        this.total.set(0);
        this.loading.set(false);
        this.toast.error('فشل تحميل بيانات الأطباء');
      },
    });
  }
}
