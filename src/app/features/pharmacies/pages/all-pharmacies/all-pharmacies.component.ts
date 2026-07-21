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
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PharmaciesService } from '../../services/pharmacies.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { Pharmacy, PharmaciesListParams } from '../../models/pharmacy.model';
import { PharmacyCardComponent } from '../../components/pharmacy-card/pharmacy-card.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SearchFilterBarComponent } from '../../../../shared/components/search-filter-bar/search-filter-bar.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-all-pharmacies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PharmacyCardComponent,
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

  protected readonly pharmacyPortalUrl = 'http://sehaty.theonesystemco.com/pharmacy';
  protected readonly linkCopied = signal(false);
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly loading      = signal(false);
  protected readonly displayed    = signal<Pharmacy[]>([]);
  protected readonly total        = signal(0);
  protected readonly currentPage  = signal(1);
  protected readonly lastUpdate   = signal<Date | null>(null);
  protected readonly activeStatus = signal<boolean | undefined>(undefined);

  protected searchValue = '';
  protected phoneValue  = '';
  private readonly search$ = new Subject<void>();

  protected readonly pageSize = signal(PAGE_SIZE);

  protected readonly kpiItems = computed<KpiItem[]>(() => [
    { icon: 'fa-prescription-bottle-medical', value: String(this.total()), label: 'إجمالي الصيدليات', variant: 'primary' },
  ]);

  ngOnInit(): void {
    this.load();

    this.search$.pipe(debounceTime(350)).subscribe(() => {
      this.currentPage.set(1);
      this.load();
    });
  }

  protected onSearch(query: string): void {
    this.searchValue = query;
    this.search$.next();
  }

  protected onPhoneChange(): void {
    this.search$.next();
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

  protected refresh(): void { this.load(); }

  protected async copyPortalLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.pharmacyPortalUrl);
      this.toast.success('تم نسخ رابط بوابة الصيدليات');
      this.linkCopied.set(true);
      if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
      this.copyResetTimer = setTimeout(() => this.linkCopied.set(false), 2000);
    } catch {
      this.toast.error('تعذر نسخ الرابط');
    }
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
      next: () => { this.toast.success(`تم ${action} الصيدلية`); this.load(); },
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
      this.load();
    } catch {
      this.toast.error('فشل حذف الصيدلية');
    }
  }

  private load(): void {
    this.loading.set(true);

    const params: PharmaciesListParams = {
      page:     this.currentPage(),
      pageSize: this.pageSize(),
    };
    if (this.searchValue.trim())           params.name     = this.searchValue.trim();
    if (this.phoneValue.trim())            params.phone    = this.phoneValue.trim();
    if (this.activeStatus() !== undefined) params.isActive = this.activeStatus();

    this.svc.getPharmacies(params).subscribe({
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
        this.toast.error('فشل تحميل بيانات الصيدليات');
      },
    });
  }
}
