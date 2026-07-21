import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ItemGroupsService } from '../../services/item-groups.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ItemGroupNodeComponent } from '../../components/item-group-node/item-group-node.component';
import { ItemGroupFormComponent, ItemGroupFormContext } from '../../components/item-group-form/item-group-form.component';
import { ItemGroup, ItemGroupLevel, ItemGroupNode } from '../../models/item-group.model';
import { itemGroupErrorAr } from '../../utils/item-group-error-ar.util';

@Component({
  selector: 'app-item-groups-list',
  standalone: true,
  imports: [CommonModule, ModalComponent, EmptyStateComponent, ItemGroupNodeComponent, ItemGroupFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-groups-list.component.html',
  styleUrl: './item-groups-list.component.scss',
})
export class ItemGroupsListComponent implements OnInit {
  private readonly svc     = inject(ItemGroupsService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router  = inject(Router);

  protected readonly loading = signal(false);
  protected readonly roots   = signal<ItemGroupNode[]>([]);

  protected readonly showAddModal = signal(false);
  protected readonly addContext   = signal<ItemGroupFormContext | null>(null);
  protected readonly editingNode  = signal<ItemGroup | null>(null);

  ngOnInit(): void { this.loadRoots(); }

  protected refresh(): void { this.loadRoots(); }

  protected openAddRoot(): void {
    this.addContext.set({ level: ItemGroupLevel.MainSection, parentId: null });
    this.showAddModal.set(true);
  }

  protected onAddChild(node: ItemGroupNode): void {
    const childLevel = node.level + 1;
    if (childLevel > ItemGroupLevel.SubGroup) return;
    this.addContext.set({ level: childLevel as ItemGroupLevel, parentId: node.id });
    this.showAddModal.set(true);
  }

  protected onEdit(node: ItemGroupNode): void {
    this.editingNode.set(node);
  }

  protected async onDelete(node: ItemGroupNode): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'حذف مجموعة',
      message: `هل أنت متأكد من حذف "${node.nameAr}"؟ لا يمكن حذف مجموعة لديها عناصر تابعة أو أصناف مرتبطة بها.`,
      confirmText: 'حذف نهائي',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await firstValueFrom(this.svc.delete(node.id));
      this.toast.success('تم حذف المجموعة بنجاح');
      this.removeNodeFromTree(node.id);
    } catch (e: any) {
      this.toast.error(itemGroupErrorAr(e, 'فشل الحذف'));
    }
  }

  protected onViewItems(node: ItemGroupNode): void {
    this.router.navigate(['/items'], { queryParams: { itemGroupId: node.id, groupName: node.nameAr } });
  }

  protected async onToggle(node: ItemGroupNode): Promise<void> {
    if (!node.expanded && !node.childrenLoaded) {
      await this.loadChildren(node);
    }
    this.updateNode(node.id, (n) => ({ ...n, expanded: !n.expanded }));
  }

  protected closeAddModal(): void {
    this.showAddModal.set(false);
    this.addContext.set(null);
  }

  protected closeEditModal(): void {
    this.editingNode.set(null);
  }

  protected onSaved(): void {
    this.closeAddModal();
    this.closeEditModal();
    this.loadRoots();
  }

  private async loadRoots(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.svc.getItemGroups({ level: ItemGroupLevel.MainSection, page: 1, pageSize: 10000 }));
      this.roots.set((res.data ?? []).map((g) => this.toNode(g)));
    } catch {
      this.toast.error('فشل تحميل مجموعات الأصناف');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadChildren(node: ItemGroupNode): Promise<void> {
    this.updateNode(node.id, (n) => ({ ...n, childrenLoading: true }));
    try {
      const res = await firstValueFrom(
        this.svc.getItemGroups({ parentId: node.id, level: node.level + 1, page: 1, pageSize: 10000 }),
      );
      const children = (res.data ?? []).map((g) => this.toNode(g));
      this.updateNode(node.id, (n) => ({ ...n, children, childrenLoaded: true, childrenLoading: false }));
    } catch {
      this.toast.error('فشل تحميل العناصر التابعة');
      this.updateNode(node.id, (n) => ({ ...n, childrenLoading: false }));
    }
  }

  private toNode(g: ItemGroup): ItemGroupNode {
    return { ...g, children: [], childrenLoaded: false, childrenLoading: false, expanded: false };
  }

  /** Recursively updates a node anywhere in the tree by id, preserving immutability for OnPush. */
  private updateNode(id: number, fn: (n: ItemGroupNode) => ItemGroupNode): void {
    const apply = (list: ItemGroupNode[]): ItemGroupNode[] =>
      list.map((n) => {
        if (n.id === id) return fn(n);
        if (n.children.length) return { ...n, children: apply(n.children) };
        return n;
      });
    this.roots.set(apply(this.roots()));
  }

  private removeNodeFromTree(id: number): void {
    const remove = (list: ItemGroupNode[]): ItemGroupNode[] =>
      list.filter((n) => n.id !== id).map((n) => ({ ...n, children: remove(n.children) }));
    this.roots.set(remove(this.roots()));
  }
}
