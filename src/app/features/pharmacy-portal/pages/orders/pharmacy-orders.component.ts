import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PharmacyOrdersService } from '../../services/pharmacy-orders.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import {
  Order,
  OrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANT,
  UpdateOrderStatusPayload,
} from '../../models/order.model';
import { FormsModule } from '@angular/forms';
import {
  OrderDetailsModalComponent,
  OrderTransitionRequest,
} from '../../components/order-details-modal/order-details-modal.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StatBadgeComponent } from '../../../../shared/components/stat-badge/stat-badge.component';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';
import { DateArPipe } from '../../../../shared/pipes/date-ar.pipe';

const PAGE_SIZE = 10;

interface StatusFilterOption {
  value: OrderStatus | undefined;
  label: string;
}

@Component({
  selector: 'app-pharmacy-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,
    EmptyStateComponent,
    StatBadgeComponent,
    KpiStripComponent,
    OrderDetailsModalComponent,
    CurrencyArPipe,
    DateArPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pharmacy-orders.component.html',
  styleUrl: './pharmacy-orders.component.scss',
})
export class PharmacyOrdersComponent implements OnInit {
  private readonly svc     = inject(PharmacyOrdersService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly route   = inject(ActivatedRoute);

  protected readonly statusLabels = ORDER_STATUS_LABELS;
  protected readonly statusVariants = ORDER_STATUS_VARIANT;
  protected readonly OrderStatus = OrderStatus;

  protected readonly selectedAction = signal<OrderStatus | null>(null);

  protected readonly statusOptions: StatusFilterOption[] = [
    { value: undefined, label: 'الكل' },
    { value: OrderStatus.Pending, label: ORDER_STATUS_LABELS[OrderStatus.Pending] },
    { value: OrderStatus.Accepted, label: ORDER_STATUS_LABELS[OrderStatus.Accepted] },
    { value: OrderStatus.Preparing, label: ORDER_STATUS_LABELS[OrderStatus.Preparing] },
    { value: OrderStatus.OutForDelivery, label: ORDER_STATUS_LABELS[OrderStatus.OutForDelivery] },
    { value: OrderStatus.Delivered, label: ORDER_STATUS_LABELS[OrderStatus.Delivered] },
    { value: OrderStatus.Rejected, label: ORDER_STATUS_LABELS[OrderStatus.Rejected] },
    { value: OrderStatus.Cancelled, label: ORDER_STATUS_LABELS[OrderStatus.Cancelled] },
  ];

  protected readonly loading     = signal(false);
  protected readonly orders      = signal<Order[]>([]);
  protected readonly total       = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly statusFilter = signal<OrderStatus | undefined>(undefined);

  protected readonly selectedOrder = signal<Order | null>(null);
  protected readonly detailsLoading = signal(false);
  protected readonly submitting = signal(false);

  /** Which order row has an inline Accept/Reject/Cancel sub-form open, if any. */
  protected readonly inlineActionOrderId = signal<number | null>(null);
  protected readonly inlineActionStatus  = signal<OrderStatus | null>(null);
  protected readonly inlineDeliveryFee   = signal<number | null>(null);
  protected readonly inlineReason        = signal('');
  protected readonly inlineSubmitting    = signal(false);

  protected get totalPages(): number { return Math.ceil(this.total() / PAGE_SIZE); }

  protected readonly kpiItems = computed<KpiItem[]>(() => [
    { icon: 'fa-cart-shopping', value: String(this.total()), label: 'إجمالي الطلبات', variant: 'primary' },
  ]);

  ngOnInit(): void {
    // Supports deep-linking from the dashboard's "needs action" cards (?status=0 etc.) —
    // falls back to the default "الكل" view when absent or invalid.
    const statusParam = this.route.snapshot.queryParamMap.get('status');
    if (statusParam !== null) {
      const parsed = Number(statusParam);
      if (Number.isInteger(parsed) && parsed in OrderStatus) {
        this.statusFilter.set(parsed);
      }
    }
    this.load();
  }

  protected onStatusFilterChange(value: OrderStatus | undefined): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.load();
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }

  protected refresh(): void { this.load(); }

  protected async openOrder(order: Order, initialAction: OrderStatus | null = null): Promise<void> {
    this.detailsLoading.set(true);
    try {
      const fresh = await firstValueFrom(this.svc.getOrder(order.id));
      this.selectedAction.set(initialAction);
      this.selectedOrder.set(fresh);
    } catch {
      this.toast.error('فشل تحميل تفاصيل الطلب');
    } finally {
      this.detailsLoading.set(false);
    }
  }

  protected closeModal(): void {
    this.selectedOrder.set(null);
    this.selectedAction.set(null);
  }

  /**
   * Merges backend-confirmed fields into both the list row and the open modal, no refetch.
   * If an active status filter no longer matches the order's new status, the row is dropped
   * from view instead of lingering with a stale filter match.
   */
  private patchOrder(id: number, patch: Partial<Order>): void {
    const filter = this.statusFilter();
    if (patch.status !== undefined && filter !== undefined && patch.status !== filter) {
      this.orders.update((list) => list.filter((o) => o.id !== id));
      this.total.update((t) => Math.max(0, t - 1));
    } else {
      this.orders.update((list) => list.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    }

    const current = this.selectedOrder();
    if (current && current.id === id) {
      this.selectedOrder.set({ ...current, ...patch });
    }
  }

  protected async onTransition(req: OrderTransitionRequest): Promise<void> {
    const payload: UpdateOrderStatusPayload = {
      targetStatus: req.targetStatus,
      deliveryFee: req.deliveryFee,
      rejectionReason: req.rejectionReason,
      cancellationReason: req.cancellationReason,
    };

    this.submitting.set(true);
    try {
      await firstValueFrom(this.svc.updateStatus(req.order.id, payload));
      this.toast.success(`تم تحديث حالة الطلب إلى «${this.statusLabels[req.targetStatus]}»`);
      this.patchOrder(req.order.id, this.buildStatusPatch(req.order, req.targetStatus, req.deliveryFee, req.rejectionReason, req.cancellationReason));
    } catch (err: any) {
      const msg = err?.error?.message ?? 'فشل تحديث حالة الطلب';
      this.toast.error(msg);
    } finally {
      this.submitting.set(false);
    }
  }

  protected async onMarkPaid(order: Order): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'تأكيد استلام الدفع',
      message:     `هل تؤكد استلام كامل المبلغ نقدًا للطلب #${order.id}؟`,
      confirmText: 'تأكيد الاستلام',
      type:        'info',
    });
    if (!ok) return;

    this.submitting.set(true);
    try {
      await firstValueFrom(this.svc.markPaid(order.id));
      this.toast.success('تم تأكيد استلام الدفع بنجاح');
      this.patchOrder(order.id, { isPaid: true });
    } catch (err: any) {
      const msg = err?.error?.message ?? 'فشل تأكيد استلام الدفع';
      this.toast.error(msg);
    } finally {
      this.submitting.set(false);
    }
  }

  /** Simple transitions (Preparing, OutForDelivery, Delivered) execute directly from the row. */
  protected async onQuickTransition(order: Order, targetStatus: OrderStatus): Promise<void> {
    this.submitting.set(true);
    try {
      await firstValueFrom(this.svc.updateStatus(order.id, { targetStatus }));
      this.toast.success(`تم تحديث حالة الطلب إلى «${this.statusLabels[targetStatus]}»`);
      this.patchOrder(order.id, this.buildStatusPatch(order, targetStatus));
    } catch (err: any) {
      const msg = err?.error?.message ?? 'فشل تحديث حالة الطلب';
      this.toast.error(msg);
    } finally {
      this.submitting.set(false);
    }
  }

  private buildStatusPatch(
    order: Order,
    targetStatus: OrderStatus,
    deliveryFee?: number,
    rejectionReason?: string,
    cancellationReason?: string,
  ): Partial<Order> {
    const patch: Partial<Order> = { status: targetStatus, updatedAt: new Date().toISOString() };
    if (targetStatus === OrderStatus.Accepted && deliveryFee !== undefined) {
      patch.deliveryFee = deliveryFee;
      patch.totalAmount = order.subTotal + deliveryFee;
    }
    if (targetStatus === OrderStatus.Rejected && rejectionReason !== undefined) {
      patch.rejectionReason = rejectionReason;
    }
    if (targetStatus === OrderStatus.Cancelled && cancellationReason !== undefined) {
      patch.cancellationReason = cancellationReason;
    }
    return patch;
  }

  // ── Inline row actions (Accept / Reject / Cancel) ────────────────

  protected openInlineAction(order: Order, targetStatus: OrderStatus): void {
    this.inlineActionOrderId.set(order.id);
    this.inlineActionStatus.set(targetStatus);
    this.inlineDeliveryFee.set(null);
    this.inlineReason.set('');
  }

  protected cancelInlineAction(): void {
    this.inlineActionOrderId.set(null);
    this.inlineActionStatus.set(null);
  }

  protected async confirmInlineAction(order: Order): Promise<void> {
    const targetStatus = this.inlineActionStatus();
    if (targetStatus === null) return;

    const payload: UpdateOrderStatusPayload = { targetStatus };
    if (targetStatus === OrderStatus.Accepted) {
      const fee = this.inlineDeliveryFee();
      if (fee == null || fee < 0) return;
      payload.deliveryFee = fee;
    } else if (targetStatus === OrderStatus.Rejected) {
      const reason = this.inlineReason().trim();
      if (!reason) return;
      payload.rejectionReason = reason;
    } else if (targetStatus === OrderStatus.Cancelled) {
      const reason = this.inlineReason().trim();
      if (!reason) return;
      payload.cancellationReason = reason;
    }

    this.inlineSubmitting.set(true);
    try {
      await firstValueFrom(this.svc.updateStatus(order.id, payload));
      this.toast.success(`تم تحديث حالة الطلب إلى «${this.statusLabels[targetStatus]}»`);
      this.patchOrder(order.id, this.buildStatusPatch(order, targetStatus, payload.deliveryFee, payload.rejectionReason, payload.cancellationReason));
      this.cancelInlineAction();
    } catch (err: any) {
      const msg = err?.error?.message ?? 'فشل تحديث حالة الطلب';
      this.toast.error(msg);
    } finally {
      this.inlineSubmitting.set(false);
    }
  }

  private load(): void {
    this.loading.set(true);

    this.svc.getOrders({
      page: this.currentPage(),
      pageSize: PAGE_SIZE,
      status: this.statusFilter(),
    }).subscribe({
      next: (res) => {
        this.orders.set(res.data ?? []);
        this.total.set(res.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.orders.set([]);
        this.total.set(0);
        this.loading.set(false);
        this.toast.error('فشل تحميل الطلبات');
      },
    });
  }
}
