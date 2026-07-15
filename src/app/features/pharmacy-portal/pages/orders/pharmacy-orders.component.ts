import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  protected readonly statusFilter = signal<OrderStatus | undefined>(OrderStatus.Pending);

  protected readonly selectedOrder = signal<Order | null>(null);
  protected readonly detailsLoading = signal(false);
  protected readonly submitting = signal(false);

  protected get totalPages(): number { return Math.ceil(this.total() / PAGE_SIZE); }

  protected readonly kpiItems = computed<KpiItem[]>(() => [
    { icon: 'fa-cart-shopping', value: String(this.total()), label: 'إجمالي الطلبات', variant: 'primary' },
  ]);

  ngOnInit(): void {
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
      const fresh = await firstValueFrom(this.svc.getOrder(req.order.id));
      this.selectedOrder.set(fresh);
      this.load();
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
      const fresh = await firstValueFrom(this.svc.getOrder(order.id));
      this.selectedOrder.set(fresh);
      this.load();
    } catch (err: any) {
      const msg = err?.error?.message ?? 'فشل تأكيد استلام الدفع';
      this.toast.error(msg);
    } finally {
      this.submitting.set(false);
    }
  }

  protected async onQuickTransition(order: Order, targetStatus: OrderStatus): Promise<void> {
    if (targetStatus === OrderStatus.Accepted || targetStatus === OrderStatus.Rejected || targetStatus === OrderStatus.Cancelled) {
      await this.openOrder(order, targetStatus);
      return;
    }

    this.submitting.set(true);
    try {
      await firstValueFrom(this.svc.updateStatus(order.id, { targetStatus }));
      this.toast.success(`تم تحديث حالة الطلب إلى «${this.statusLabels[targetStatus]}»`);
      this.load();
    } catch (err: any) {
      const msg = err?.error?.message ?? 'فشل تحديث حالة الطلب';
      this.toast.error(msg);
    } finally {
      this.submitting.set(false);
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
