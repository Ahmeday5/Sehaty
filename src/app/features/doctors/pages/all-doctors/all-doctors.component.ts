import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { DoctorsService } from '../../services/doctors.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { Doctor } from '../../models/doctor.model';
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

const ITEMS_PER_PAGE = 12;

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

  @ViewChild('filterWrap') filterWrap!: ElementRef<HTMLDivElement>;

  protected readonly loading          = signal(false);
  protected readonly specialities     = signal<Speciality[]>([]);
  protected readonly selectedFilter   = signal<string | null>(null);
  protected readonly currentPage      = signal(1);
  protected readonly showAddModal     = signal(false);
  protected readonly editingDoctor    = signal<Doctor | null>(null);
  protected readonly lastUpdate       = signal<Date | null>(null);
  protected searchValue = '';

  private allDoctors: Doctor[] = [];
  protected filteredDoctors: Doctor[] = [];

  protected readonly totalPages = signal(0);
  protected readonly displayed  = signal<Doctor[]>([]);

  protected get totalCount():    number { return this.allDoctors.length; }
  protected get activeCount():   number { return this.allDoctors.filter((d) => d.isActive).length; }
  protected get inactiveCount(): number { return this.allDoctors.filter((d) => !d.isActive).length; }

  protected readonly kpiItems = computed<KpiItem[]>(() => [
    {
      icon: 'fa-user-doctor',
      value: String(this.totalCount),
      label: 'إجمالي الأطباء',
      variant: 'primary',
    },
    {
      icon: 'fa-circle-check',
      value: String(this.activeCount),
      label: 'أطباء نشطون',
      variant: 'green',
    },
    {
      icon: 'fa-circle-xmark',
      value: String(this.inactiveCount),
      label: 'أطباء معطّلون',
      variant: 'red',
    },
    {
      icon: 'fa-stethoscope',
      value: String(this.specialities().length),
      label: 'التخصصات',
      variant: 'blue',
    },
  ]);

  protected readonly filterOpts = computed<FilterOption[]>(() => [
    { id: null, label: 'الكل' },
    ...this.specialities().map((s) => ({ id: s.name, label: s.name })),
  ]);

  ngOnInit(): void {
    this.loadSpecialities();
    this.loadAllDoctors();
  }

  protected onSearch(query: string): void { this.doSearch(query); }

  protected onFilterChange(id: string | null): void {
    this.onFilterClick(id);
  }

  protected onFilterClick(name: string | null): void {
    this.selectedFilter.set(name);
    this.currentPage.set(1);
    if (name === null) {
      this.setDisplayed(this.allDoctors);
      return;
    }
    this.loading.set(true);
    this.svc.getDoctorsBySpecialization(name).subscribe({
      next: (data) => { this.setDisplayed(data); this.loading.set(false); },
      error: () => { this.setDisplayed([]); this.loading.set(false); },
    });
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.updatePage();
  }

  protected openAdd(): void  { this.showAddModal.set(true);  }
  protected closeAdd(): void { this.showAddModal.set(false); }

  protected openEdit(doctor: Doctor): void  { this.editingDoctor.set(doctor); }
  protected closeEdit(): void               { this.editingDoctor.set(null);   }

  protected onSaved(): void {
    this.showAddModal.set(false);
    this.editingDoctor.set(null);
    this.refresh();
  }

  protected refresh(): void {
    this.svc.invalidate();
    this.loadAllDoctors();
  }

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
      next: () => { this.toast.success(`تم ${action} الطبيب`); this.refresh(); },
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
      this.refresh();
    } catch {
      this.toast.error('فشل حذف الطبيب');
    }
  }

  protected scrollFilters(dir: number): void {
    const el = this.filterWrap?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  }

  private loadSpecialities(): void {
    this.svc.getAllSpecialities().subscribe({ next: (data) => this.specialities.set(data) });
  }

  private loadAllDoctors(): void {
    this.loading.set(true);
    this.svc.getAllDoctors().subscribe({
      next: (data) => {
        this.allDoctors = data;
        this.setDisplayed(data);
        this.lastUpdate.set(new Date());
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private doSearch(query: string): void {
    if (!query.trim()) {
      const sf = this.selectedFilter();
      this.setDisplayed(sf ? this.allDoctors.filter((d) => d.specialization === sf) : this.allDoctors);
      return;
    }
    this.loading.set(true);
    this.svc.searchByName(query).subscribe({
      next: (data) => {
        const sf = this.selectedFilter();
        this.setDisplayed(sf ? data.filter((d) => d.specialization === sf) : data);
        this.loading.set(false);
      },
      error: () => { this.setDisplayed([]); this.loading.set(false); },
    });
  }

  private setDisplayed(data: Doctor[]): void {
    this.filteredDoctors = data;
    this.totalPages.set(Math.ceil(data.length / ITEMS_PER_PAGE));
    this.currentPage.set(1);
    this.updatePage();
  }

  private updatePage(): void {
    const start = (this.currentPage() - 1) * ITEMS_PER_PAGE;
    this.displayed.set(this.filteredDoctors.slice(start, start + ITEMS_PER_PAGE));
  }
}
