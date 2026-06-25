import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { PharmaciesService } from '../../services/pharmacies.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { Pharmacy } from '../../models/pharmacy.model';
import { PharmacyCardComponent } from '../../components/pharmacy-card/pharmacy-card.component';
import { PharmacyFormComponent } from '../../components/pharmacy-form/pharmacy-form.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SearchFilterBarComponent } from '../../../../shared/components/search-filter-bar/search-filter-bar.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';

const ITEMS_PER_PAGE = 12;

@Component({
  selector: 'app-all-pharmacies',
  standalone: true,
  imports: [
    CommonModule,
    PharmacyCardComponent,
    PharmacyFormComponent,
    ModalComponent,
    PaginationComponent,
    KpiStripComponent,
    EmptyStateComponent,
    SearchFilterBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './all-pharmacies.component.html',
  styleUrl: './all-pharmacies.component.scss',
})
export class AllPharmaciesComponent implements OnInit {
  private readonly svc     = inject(PharmaciesService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly loading         = signal(false);
  protected readonly currentPage     = signal(1);
  protected readonly showAddModal    = signal(false);
  protected readonly editingPharmacy = signal<Pharmacy | null>(null);

  private allPharmacies: Pharmacy[] = [];
  protected filteredPharmacies: Pharmacy[] = [];

  protected readonly totalPages = signal(0);
  protected readonly displayed  = signal<Pharmacy[]>([]);

  protected get totalCount():  number { return this.allPharmacies.length; }
  protected get activeCount(): number { return this.allPharmacies.filter((p) => p.isActive).length; }
  protected get inactiveCount(): number { return this.allPharmacies.filter((p) => !p.isActive).length; }
  protected get totalPrescriptions(): number {
    return this.allPharmacies.reduce((acc, p) => acc + (p.prescriptionsCount ?? 0), 0);
  }

  protected readonly kpiItems = computed<KpiItem[]>(() => {
    const _ = this.displayed(); // track signal
    return [
      { icon: 'fa-prescription-bottle-medical', value: String(this.totalCount),        label: 'إجمالي الصيدليات', variant: 'primary' },
      { icon: 'fa-circle-check',                value: String(this.activeCount),        label: 'صيدليات نشطة',     variant: 'green'   },
      { icon: 'fa-circle-xmark',                value: String(this.inactiveCount),      label: 'صيدليات معطّلة',    variant: 'red'     },
      { icon: 'fa-file-prescription',           value: String(this.totalPrescriptions), label: 'إجمالي الوصفات',   variant: 'blue'    },
    ];
  });

  ngOnInit(): void { this.loadAll(); }

  protected onSearch(query: string): void {
    if (!query.trim()) {
      this.setDisplayed(this.allPharmacies);
      return;
    }
    this.loading.set(true);
    this.svc.searchByName(query).subscribe({
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

  protected openEdit(p: Pharmacy): void  { this.editingPharmacy.set(p);    }
  protected closeEdit(): void            { this.editingPharmacy.set(null);  }

  protected onSaved(): void {
    this.showAddModal.set(false);
    this.editingPharmacy.set(null);
    this.refresh();
  }

  protected refresh(): void {
    this.svc.invalidate();
    this.loadAll();
  }

  protected async onToggleActive(p: Pharmacy): Promise<void> {
    const action = p.isActive ? 'تعطيل' : 'تفعيل';
    const ok = await this.confirm.confirm({
      title:       `${action} الصيدلية`,
      message:     `هل تريد ${action} صيدلية "${p.name}"؟`,
      confirmText: action,
      type:        p.isActive ? 'danger' : 'info',
    });
    if (!ok) return;
    const call$ = p.isActive ? this.svc.deactivatePharmacy(p.id) : this.svc.activatePharmacy(p.id);
    call$.subscribe({
      next: () => { this.toast.success(`تم ${action} الصيدلية`); this.refresh(); },
      error: (e) => this.toast.error(e?.message ?? `فشل ${action} الصيدلية`),
    });
  }

  protected async onDelete(p: Pharmacy): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'حذف الصيدلية',
      message:     `هل أنت متأكد من حذف صيدلية "${p.name}"؟ لا يمكن التراجع.`,
      confirmText: 'حذف نهائي',
      type:        'danger',
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.svc.deletePharmacy(p.id));
      this.toast.success('تم حذف الصيدلية بنجاح');
      this.refresh();
    } catch {
      this.toast.error('فشل حذف الصيدلية');
    }
  }

  private loadAll(): void {
    this.loading.set(true);
    this.svc.getAllPharmacies().subscribe({
      next: (data) => { this.allPharmacies = data; this.setDisplayed(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private setDisplayed(data: Pharmacy[]): void {
    this.filteredPharmacies = data;
    this.totalPages.set(Math.ceil(data.length / ITEMS_PER_PAGE));
    this.currentPage.set(1);
    this.updatePage();
  }

  private updatePage(): void {
    const start = (this.currentPage() - 1) * ITEMS_PER_PAGE;
    this.displayed.set(this.filteredPharmacies.slice(start, start + ITEMS_PER_PAGE));
  }
}
