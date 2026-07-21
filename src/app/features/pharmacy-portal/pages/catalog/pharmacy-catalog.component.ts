import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PharmacyCatalogService } from '../../services/pharmacy-catalog.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ItemGroup, MasterItem, PharmacyCatalogItem } from '../../models/catalog.model';
import { CatalogItemCardComponent } from '../../components/catalog-item-card/catalog-item-card.component';
import { MasterItemCardComponent } from '../../components/master-item-card/master-item-card.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SearchFilterBarComponent } from '../../../../shared/components/search-filter-bar/search-filter-bar.component';
import { TabsNavComponent } from '../../../../shared/components/tabs-nav/tabs-nav.component';
import { TabDef } from '../../../../shared/components/tabs-nav/tabs-nav.model';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';
import { SearchableSelectComponent, SelectOption } from '../../../../shared/components/searchable-select/searchable-select.component';

type CatalogTab = 'mine' | 'browse';

@Component({
  selector: 'app-pharmacy-catalog',
  standalone: true,
  imports: [
    CommonModule,
    CatalogItemCardComponent,
    MasterItemCardComponent,
    PaginationComponent,
    KpiStripComponent,
    EmptyStateComponent,
    SearchFilterBarComponent,
    TabsNavComponent,
    SearchableSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pharmacy-catalog.component.html',
  styleUrl: './pharmacy-catalog.component.scss',
})
export class PharmacyCatalogComponent implements OnInit {
  private readonly svc     = inject(PharmacyCatalogService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly tabs: TabDef[] = [
    { id: 'mine',   label: 'أصنافي',        icon: 'fa-pills' },
    { id: 'browse', label: 'تصفح الكتالوج', icon: 'fa-magnifying-glass' },
  ];
  protected readonly activeTab = signal<CatalogTab>('mine');

  // ── My catalog state ──────────────────────────────────────────
  protected readonly mineLoading   = signal(false);
  protected readonly mineItems     = signal<PharmacyCatalogItem[]>([]);
  protected readonly mineTotal     = signal(0);
  protected readonly minePage      = signal(1);
  protected readonly minePageSize  = signal(12);
  protected readonly mineAvailable = signal<boolean | undefined>(undefined);
  protected readonly togglingId    = signal<number | null>(null);
  protected readonly deletingId    = signal<number | null>(null);

  protected mineSearch = '';
  private readonly mineSearch$ = new Subject<void>();

  protected readonly mineKpis = computed<KpiItem[]>(() => [
    { icon: 'fa-pills', value: String(this.mineTotal()), label: 'إجمالي الأصناف', variant: 'primary' },
  ]);

  // ── Browse master catalog state ───────────────────────────────
  protected readonly browseLoading = signal(false);
  protected readonly browseItems   = signal<MasterItem[]>([]);
  protected readonly browseTotal    = signal(0);
  protected readonly browsePage     = signal(1);
  protected readonly browsePageSize = signal(12);
  protected readonly addingId       = signal<number | null>(null);
  protected browseLoaded = false;

  protected readonly itemGroups       = signal<ItemGroup[]>([]);
  protected readonly browseGroupId    = signal<number | null>(null);
  protected readonly itemGroupOptions = computed<SelectOption[]>(() =>
    this.itemGroups().map((g) => ({ value: g.id, label: `${g.nameAr} (${g.code})` })),
  );

  protected browseSearch = '';
  private readonly browseSearch$ = new Subject<void>();

  ngOnInit(): void {
    this.loadMine();

    this.mineSearch$.pipe(debounceTime(350)).subscribe(() => {
      this.minePage.set(1);
      this.loadMine();
    });

    this.browseSearch$.pipe(debounceTime(350)).subscribe(() => {
      this.browsePage.set(1);
      this.loadBrowse();
    });
  }

  protected onTabChange(id: string): void {
    this.activeTab.set(id as CatalogTab);
    if (id === 'browse' && !this.browseLoaded) {
      this.loadItemGroups();
      this.loadBrowse();
    }
  }

  // ── My catalog actions ────────────────────────────────────────

  protected onMineSearch(query: string): void {
    this.mineSearch = query;
    this.mineSearch$.next();
  }

  protected onAvailabilityFilter(val: boolean | undefined): void {
    this.mineAvailable.set(val);
    this.minePage.set(1);
    this.loadMine();
  }

  protected onMinePageChange(page: number): void { this.minePage.set(page); this.loadMine(); }

  protected onMinePageSizeChange(size: number): void {
    this.minePageSize.set(size);
    this.minePage.set(1);
    this.loadMine();
  }

  protected refreshMine(): void { this.loadMine(); }

  protected async onToggleAvailability(item: PharmacyCatalogItem): Promise<void> {
    this.togglingId.set(item.id);
    try {
      await firstValueFrom(this.svc.toggleAvailability(item.id));
      this.toast.success(item.isAvailable ? 'تم إخفاء الصنف' : 'تم إتاحة الصنف');
      this.loadMine();
    } catch {
      this.toast.error('فشل تحديث حالة الصنف');
    } finally {
      this.togglingId.set(null);
    }
  }

  protected async onDeleteItem(item: PharmacyCatalogItem): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'حذف الصنف',
      message:     `هل أنت متأكد من حذف "${item.itemNameAr}" نهائيًا من قائمة صيدليتك؟`,
      confirmText: 'حذف نهائي',
      type:        'danger',
    });
    if (!ok) return;

    this.deletingId.set(item.id);
    try {
      await firstValueFrom(this.svc.deleteItem(item.id));
      this.toast.success('تم حذف الصنف بنجاح');
      this.loadMine();
      // Reflect the removal in the already-loaded browse list without a full refetch.
      this.browseItems.update((list) =>
        list.map((i) => (i.id === item.itemId ? { ...i, alreadyAdded: false } : i)),
      );
    } catch {
      this.toast.error('فشل حذف الصنف');
    } finally {
      this.deletingId.set(null);
    }
  }

  private loadMine(): void {
    this.mineLoading.set(true);

    this.svc.getCatalog({
      page:        this.minePage(),
      pageSize:    this.minePageSize(),
      search:      this.mineSearch.trim() || undefined,
      isAvailable: this.mineAvailable(),
    }).subscribe({
      next: (res) => {
        this.mineItems.set(res.data ?? []);
        this.mineTotal.set(res.total ?? 0);
        this.mineLoading.set(false);
      },
      error: () => {
        this.mineItems.set([]);
        this.mineTotal.set(0);
        this.mineLoading.set(false);
        this.toast.error('فشل تحميل أصناف صيدليتك');
      },
    });
  }

  // ── Browse actions ────────────────────────────────────────────

  protected onBrowseSearch(query: string): void {
    this.browseSearch = query;
    this.browseSearch$.next();
  }

  protected onBrowseGroupChange(value: string | number | null): void {
    this.browseGroupId.set(value == null ? null : Number(value));
    this.browsePage.set(1);
    this.loadBrowse();
  }

  protected onBrowsePageChange(page: number): void { this.browsePage.set(page); this.loadBrowse(); }

  protected onBrowsePageSizeChange(size: number): void {
    this.browsePageSize.set(size);
    this.browsePage.set(1);
    this.loadBrowse();
  }

  protected refreshBrowse(): void { this.loadBrowse(); }

  protected async onAddItem(item: MasterItem): Promise<void> {
    this.addingId.set(item.id);
    try {
      await firstValueFrom(this.svc.addItem(item.id));
      this.toast.success(`تمت إضافة "${item.nameAr}" إلى صيدليتك`);
      this.browseItems.update((list) =>
        list.map((i) => (i.id === item.id ? { ...i, alreadyAdded: true } : i)),
      );
      // Keep "My Catalog" in sync immediately so it reflects the new item without a manual refresh.
      this.loadMine();
    } catch (err: any) {
      const msg = err?.error?.message ?? 'فشل إضافة الصنف إلى صيدليتك';
      this.toast.error(msg);
    } finally {
      this.addingId.set(null);
    }
  }

  private loadBrowse(): void {
    this.browseLoading.set(true);
    this.browseLoaded = true;

    this.svc.browseMasterItems({
      page:     this.browsePage(),
      pageSize: this.browsePageSize(),
      search:   this.browseSearch.trim() || undefined,
      groupId:  this.browseGroupId() ?? undefined,
    }).subscribe({
      next: (res) => {
        this.browseItems.set(res.data ?? []);
        this.browseTotal.set(res.total ?? 0);
        this.browseLoading.set(false);
      },
      error: () => {
        this.browseItems.set([]);
        this.browseTotal.set(0);
        this.browseLoading.set(false);
        this.toast.error('فشل تحميل كتالوج الأصناف');
      },
    });
  }

  private loadItemGroups(): void {
    this.svc.getItemGroups().subscribe({
      next: (res) => this.itemGroups.set(res.data ?? []),
      error: () => this.toast.error('فشل تحميل تصنيفات الأصناف'),
    });
  }
}
