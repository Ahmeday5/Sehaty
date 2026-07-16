import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Prescription,
  PRESCRIPTION_STATUS_LABELS,
  PRESCRIPTION_STATUS_VARIANT,
  PrescriptionReviewRequest,
  PrescriptionStatus,
} from '../../models/prescription.model';
import { StatBadgeComponent } from '../../../../shared/components/stat-badge/stat-badge.component';
import { DateArPipe } from '../../../../shared/pipes/date-ar.pipe';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'app-prescription-card',
  standalone: true,
  imports: [CommonModule, FormsModule, StatBadgeComponent, DateArPipe],
  templateUrl: './prescription-card.component.html',
  styleUrl: './prescription-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescriptionCardComponent {
  private readonly confirm = inject(ConfirmService);

  prescription = input.required<Prescription>();
  submitting = input(false);

  open = output<Prescription>();
  review = output<PrescriptionReviewRequest>();

  protected readonly PrescriptionStatus = PrescriptionStatus;
  protected readonly statusLabels = PRESCRIPTION_STATUS_LABELS;
  protected readonly statusVariants = PRESCRIPTION_STATUS_VARIANT;

  protected readonly hasOrder = computed(() => !!this.prescription().orderId);

  protected imageFailed = false;

  /** Inline reject sub-form state, shown directly on the card. */
  protected readonly rejecting = signal(false);
  protected rejectionReason = signal('');

  protected onImageError(): void {
    this.imageFailed = true;
  }

  protected async onAcceptClick(event: Event): Promise<void> {
    event.stopPropagation();
    const ok = await this.confirm.confirm({
      title:       'تأكيد قبول الروشتة',
      message:     'هل أنت متأكد من قبول هذه الروشتة؟ سيمكنك بعدها إنشاء طلب منها.',
      confirmText: 'تأكيد القبول',
      type:        'info',
    });
    if (!ok) return;
    this.review.emit({ prescription: this.prescription(), accept: true });
  }

  protected onRejectClick(event: Event): void {
    event.stopPropagation();
    this.rejectionReason.set('');
    this.rejecting.set(true);
  }

  protected cancelReject(event: Event): void {
    event.stopPropagation();
    this.rejecting.set(false);
  }

  protected confirmReject(event: Event): void {
    event.stopPropagation();
    const reason = this.rejectionReason().trim();
    if (!reason) return;
    this.review.emit({ prescription: this.prescription(), accept: false, rejectionReason: reason });
    this.rejecting.set(false);
  }

  protected stop(event: Event): void {
    event.stopPropagation();
  }
}
