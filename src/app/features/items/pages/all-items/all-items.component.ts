import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ItemsService } from '../../services/items.service';
import { ItemGroupsService } from '../../../item-groups/services/item-groups.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ItemCardComponent } from '../../components/item-card/item-card.component';
import { ItemFormComponent } from '../../components/item-form/item-form.component';
import { itemErrorAr } from '../../utils/item-error-ar.util';
import { Item } from '../../models/item.model';
import { ItemGroup, ItemGroupLevel } from '../../../item-groups/models/item-group.model';

@Component({
  selector: 'app-all-items',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ModalComponent, EmptyStateComponent,
    PaginationComponent, ItemCardComponent, ItemFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './all-items.component.html',
  styleUrl: './all-items.component.scss',
})
export class AllItemsComponent implements OnInit {
  private readonly svc     = inject(ItemsService);
  private readonly groups  = inject(ItemGroupsService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);

  protected readonly loading   = signal(false);
  protected readonly items     = signal<Item[]>([]);
  protected readonly total     = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly pageSize    = signal(24);

  protected readonly subGroups     = signal<ItemGroup[]>([]);
  protected readonly selectedGroup = signal<number | undefined>(undefined);
  protected readonly groupName     = signal<string | null>(null);

  protected readonly codeSearch    = signal('');
  protected readonly barcodeSearch = signal('');

  protected readonly showAddModal = signal(false);
  protected readonly editingItem  = signal<Item | null>(null);

  private readonly codeSearch$    = new Subject<string>();
  private readonly barcodeSearch$ = new Subject<string>();

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const groupId = qp.get('itemGroupId');
    if (groupId) this.selectedGroup.set(Number(groupId));
    if (qp.get('groupName')) this.groupName.set(qp.get('groupName'));

    this.loadAllSubGroups();
    this.load();

    this.codeSearch$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((v) => {
      this.codeSearch.set(v);
      this.currentPage.set(1);
      this.load();
    });
    this.barcodeSearch$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((v) => {
      this.barcodeSearch.set(v);
      this.currentPage.set(1);
      this.load();
    });
  }

  protected onCodeInput(v: string): void { this.codeSearch$.next(v); }
  protected onBarcodeInput(v: string): void { this.barcodeSearch$.next(v); }

  protected onGroupFilterChange(value: string): void {
    this.selectedGroup.set(value ? Number(value) : undefined);
    this.groupName.set(null);
    this.currentPage.set(1);
    this.load();
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  protected clearGroupFilter(): void {
    this.selectedGroup.set(undefined);
    this.groupName.set(null);
    this.currentPage.set(1);
    this.load();
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.load();
  }

  protected refresh(): void { this.load(); }

  protected openAdd(): void { this.showAddModal.set(true); }
  protected closeAdd(): void { this.showAddModal.set(false); }

  protected openEdit(item: Item): void { this.editingItem.set(item); }
  protected closeEdit(): void { this.editingItem.set(null); }

  protected onSaved(): void {
    this.closeAdd();
    this.closeEdit();
    this.load();
  }

  protected async onDelete(item: Item): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'حذف صنف',
      message: `هل أنت متأكد من حذف "${item.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف نهائي',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await firstValueFrom(this.svc.deleteItem(item.id));
      this.toast.success('تم حذف الصنف بنجاح');
      this.load();
    } catch (e: any) {
      this.toast.error(itemErrorAr(e, 'فشل الحذف'));
    }
  }

  private load(): void {
    this.loading.set(true);
    this.svc.getItems({
      itemGroupId: this.selectedGroup(),
      code:        this.codeSearch(),
      barcode:     this.barcodeSearch(),
      page:        this.currentPage(),
      pageSize:    this.pageSize(),
    }).subscribe({
      next: (res) => {
        this.items.set(res.data ?? []);
        this.total.set(res.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('فشل تحميل الأصناف');
        this.loading.set(false);
      },
    });
  }

  private loadAllSubGroups(): void {
    this.groups.getItemGroups({ level: ItemGroupLevel.SubGroup, page: 1, pageSize: 10000 })
      .subscribe((res) => this.subGroups.set(res.data ?? []));
  }
}
