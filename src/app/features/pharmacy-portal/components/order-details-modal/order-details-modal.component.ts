import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StatBadgeComponent } from '../../../../shared/components/stat-badge/stat-badge.component';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';
import { DateArPipe } from '../../../../shared/pipes/date-ar.pipe';
import {
  Order,
  OrderStatus,
  ORDER_ALLOWED_TRANSITIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANT,
  PAYMENT_METHOD_LABELS,
} from '../../models/order.model';

export interface OrderTransitionRequest {
  order: Order;
  targetStatus: OrderStatus;
  deliveryFee?: number;
  rejectionReason?: string;
  cancellationReason?: string;
}

@Component({
  selector: 'app-order-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, StatBadgeComponent, CurrencyArPipe, DateArPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-details-modal.component.html',
  styleUrl: './order-details-modal.component.scss',
})
export class OrderDetailsModalComponent {
  order = input.required<Order>();
  submitting = input(false);
  initialAction = input<OrderStatus | null>(null);

  closed = output<void>();
  transition = output<OrderTransitionRequest>();
  markPaidClick = output<Order>();

  protected readonly OrderStatus = OrderStatus;
  protected readonly statusLabels = ORDER_STATUS_LABELS;

  /** Which reason/fee sub-form is currently open, if any. */
  protected readonly pendingAction = signal<OrderStatus | null>(null);

  protected deliveryFee = signal<number | null>(null);
  protected rejectionReason = signal('');
  protected cancellationReason = signal('');

  protected readonly statusLabel = computed(() => this.statusLabels[this.order().status]);
  protected readonly statusVariant = computed(() => ORDER_STATUS_VARIANT[this.order().status]);
  protected readonly paymentLabel = computed(() => PAYMENT_METHOD_LABELS[this.order().paymentMethod] ?? '—');

  protected readonly allowedTransitions = computed(() => ORDER_ALLOWED_TRANSITIONS[this.order().status] ?? []);

  constructor() {
    effect(() => {
      const action = this.initialAction();
      if (action === OrderStatus.Accepted || action === OrderStatus.Rejected || action === OrderStatus.Cancelled) {
        this.pendingAction.set(action);
        this.deliveryFee.set(null);
        this.rejectionReason.set('');
        this.cancellationReason.set('');
      }
    });
  }

  protected readonly canMarkPaid = computed(
    () => this.order().status === OrderStatus.Delivered && !this.order().isPaid,
  );

  protected readonly hasCoordinates = computed(() => {
    const o = this.order();
    return !!o.deliveryLat && !!o.deliveryLng && !isNaN(Number(o.deliveryLat)) && !isNaN(Number(o.deliveryLng));
  });

  protected readonly googleMapsUrl = computed(() => {
    const o = this.order();
    return `https://www.google.com/maps?q=${o.deliveryLat},${o.deliveryLng}`;
  });

  protected displayValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return String(value);
  }

  protected displayBoolean(value: boolean): string {
    return value ? 'نعم' : 'لا';
  }

  protected close(): void {
    this.closed.emit();
  }

  protected labelFor(status: OrderStatus): string {
    return this.statusLabels[status];
  }

  /** Simple transitions (Preparing, OutForDelivery, Delivered) fire immediately; the rest open a sub-form. */
  protected onTransitionClick(target: OrderStatus): void {
    if (target === OrderStatus.Accepted || target === OrderStatus.Rejected || target === OrderStatus.Cancelled) {
      this.pendingAction.set(target);
      this.deliveryFee.set(null);
      this.rejectionReason.set('');
      this.cancellationReason.set('');
      return;
    }
    this.transition.emit({ order: this.order(), targetStatus: target });
  }

  protected cancelPendingAction(): void {
    this.pendingAction.set(null);
  }

  protected confirmAccept(): void {
    const fee = this.deliveryFee();
    if (fee == null || fee < 0) return;
    this.transition.emit({ order: this.order(), targetStatus: OrderStatus.Accepted, deliveryFee: fee });
  }

  protected confirmReject(): void {
    const reason = this.rejectionReason().trim();
    if (!reason) return;
    this.transition.emit({ order: this.order(), targetStatus: OrderStatus.Rejected, rejectionReason: reason });
  }

  protected confirmCancel(): void {
    const reason = this.cancellationReason().trim();
    if (!reason) return;
    this.transition.emit({ order: this.order(), targetStatus: OrderStatus.Cancelled, cancellationReason: reason });
  }

  protected onMarkPaid(): void {
    this.markPaidClick.emit(this.order());
  }
}
