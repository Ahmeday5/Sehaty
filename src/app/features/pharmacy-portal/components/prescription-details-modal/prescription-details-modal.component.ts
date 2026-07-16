import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StatBadgeComponent } from '../../../../shared/components/stat-badge/stat-badge.component';
import { DateArPipe } from '../../../../shared/pipes/date-ar.pipe';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';
import { PharmacyCatalogService } from '../../services/pharmacy-catalog.service';
import { PharmacyCatalogItem } from '../../models/catalog.model';
import {
  Prescription,
  PRESCRIPTION_STATUS_LABELS,
  PRESCRIPTION_STATUS_VARIANT,
  PrescriptionCreateOrderRequest,
  PrescriptionReviewRequest,
  PrescriptionStatus,
} from '../../models/prescription.model';

interface OrderLine {
  item: PharmacyCatalogItem;
  quantity: number;
}

@Component({
  selector: 'app-prescription-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, StatBadgeComponent, DateArPipe, CurrencyArPipe],
  templateUrl: './prescription-details-modal.component.html',
  styleUrl: './prescription-details-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescriptionDetailsModalComponent {
  private readonly catalogSvc = inject(PharmacyCatalogService);

  prescription = input.required<Prescription>();
  submitting = input(false);

  closed = output<void>();
  review = output<PrescriptionReviewRequest>();
  createOrder = output<PrescriptionCreateOrderRequest>();

  protected readonly PrescriptionStatus = PrescriptionStatus;
  protected readonly statusLabels = PRESCRIPTION_STATUS_LABELS;

  protected readonly statusLabel = computed(() => this.statusLabels[this.prescription().status]);
  protected readonly statusVariant = computed(() => PRESCRIPTION_STATUS_VARIANT[this.prescription().status]);

  protected readonly hasOrder = computed(() => !!this.prescription().orderId);

  protected readonly hasCoordinates = computed(() => {
    const p = this.prescription();
    return !!p.deliveryLat && !!p.deliveryLng && !isNaN(Number(p.deliveryLat)) && !isNaN(Number(p.deliveryLng));
  });

  protected readonly googleMapsUrl = computed(() => {
    const p = this.prescription();
    return `https://www.google.com/maps?q=${p.deliveryLat},${p.deliveryLng}`;
  });

  /** Review sub-form (reject reason), null when not shown. */
  protected readonly reviewAction = signal<'accept' | 'reject' | null>(null);
  protected rejectionReason = signal('');

  /** "Build order from prescription" flow — only reachable when Accepted && !orderId. */
  protected readonly catalogLoading = signal(false);
  protected readonly catalogItems = signal<PharmacyCatalogItem[]>([]);
  protected catalogSearch = '';
  protected readonly orderLines = signal<OrderLine[]>([]);

  protected readonly orderLinesTotal = computed(() =>
    this.orderLines().reduce((sum, l) => sum + l.item.defaultConsumerPrice * l.quantity, 0),
  );

  private catalogLoadedForOrderBuild = false;
  private readonly catalogSearch$ = new Subject<void>();
  private readonly destroyed$ = new Subject<void>();

  constructor() {
    // Reacts to the prescription transitioning into "Accepted + no order yet" — including a
    // live transition that happens while this same modal instance stays open (accept → build
    // order immediately), not just on first mount.
    effect(() => {
      const canBuildOrder = this.prescription().status === PrescriptionStatus.Accepted && !this.hasOrder();
      if (canBuildOrder && !this.catalogLoadedForOrderBuild) {
        this.catalogLoadedForOrderBuild = true;
        this.loadCatalog();
      }
    }, { allowSignalWrites: true });

    this.catalogSearch$.pipe(debounceTime(300), takeUntil(this.destroyed$)).subscribe(() => this.loadCatalog());
    inject(DestroyRef).onDestroy(() => this.destroyed$.next());
  }

  protected displayValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
  }

  protected close(): void {
    this.closed.emit();
  }

  protected startAccept(): void {
    this.reviewAction.set('accept');
  }

  protected startReject(): void {
    this.reviewAction.set('reject');
    this.rejectionReason.set('');
  }

  protected cancelReview(): void {
    this.reviewAction.set(null);
  }

  protected confirmAccept(): void {
    this.review.emit({ prescription: this.prescription(), accept: true });
    this.reviewAction.set(null);
  }

  protected confirmReject(): void {
    const reason = this.rejectionReason().trim();
    if (!reason) return;
    this.review.emit({ prescription: this.prescription(), accept: false, rejectionReason: reason });
    this.reviewAction.set(null);
  }

  // ── Build order from prescription ────────────────────────────────

  protected onCatalogSearch(): void {
    this.catalogSearch$.next();
  }

  private loadCatalog(): void {
    this.catalogLoading.set(true);
    this.catalogSvc.getCatalog({
      page: 1,
      pageSize: 50,
      isAvailable: true,
      search: this.catalogSearch.trim() || undefined,
    }).subscribe({
      next: (res) => {
        this.catalogItems.set(res.data ?? []);
        this.catalogLoading.set(false);
      },
      error: () => this.catalogLoading.set(false),
    });
  }

  protected isInOrder(item: PharmacyCatalogItem): boolean {
    return this.orderLines().some((l) => l.item.id === item.id);
  }

  protected addLine(item: PharmacyCatalogItem): void {
    if (this.isInOrder(item)) return;
    this.orderLines.update((lines) => [...lines, { item, quantity: 1 }]);
  }

  protected removeLine(item: PharmacyCatalogItem): void {
    this.orderLines.update((lines) => lines.filter((l) => l.item.id !== item.id));
  }

  protected setQuantity(item: PharmacyCatalogItem, quantity: number): void {
    const qty = Math.max(1, Math.floor(quantity) || 1);
    this.orderLines.update((lines) => lines.map((l) => (l.item.id === item.id ? { ...l, quantity: qty } : l)));
  }

  protected submitOrder(): void {
    const lines = this.orderLines();
    if (lines.length === 0) return;
    this.createOrder.emit({
      prescription: this.prescription(),
      items: lines.map((l) => ({ pharmacyItemId: l.item.id, quantity: l.quantity })),
    });
  }
}
