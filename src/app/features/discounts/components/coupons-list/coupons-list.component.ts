import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { Coupon, CouponForm } from '../../models/discount.model';

@Component({
  selector: 'app-coupons-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './coupons-list.component.html',
  styleUrl: './coupons-list.component.scss',
})
export class CouponsListComponent {
  private readonly toast = inject(ToastService);

  protected readonly showModal = signal(false);

  protected readonly coupons: readonly Coupon[] = [
    { id: 1, code: 'SHIFA20',   type: 'percentage', value: 20,  used: 120, maxUses: 200, scope: 'كل الأطباء',      expiry: '30 يونيو 2025',      active: true  },
    { id: 2, code: 'WELCOME50', type: 'percentage', value: 50,  used:  48, maxUses: 100, scope: 'كل الأطباء',      expiry: '31 ديسمبر 2025',     active: true  },
    { id: 3, code: 'HEART30',   type: 'percentage', value: 30,  used:  85, maxUses: 150, scope: 'أمراض القلب',     expiry: '15 يوليو 2025',      active: true  },
    { id: 4, code: 'RAMADAN',   type: 'fixed',      value: 50,  used: 500, maxUses: 500, scope: 'كل الأطباء',      expiry: '15 أبريل 2024',      active: false },
    { id: 5, code: 'APP15',     type: 'percentage', value: 15,  used: 230, maxUses: 1000, scope: 'كل الأطباء',     expiry: '31 ديسمبر 2025',     active: true  },
    { id: 6, code: 'KIDS20',    type: 'percentage', value: 20,  used:  60, maxUses: 300, scope: 'طب الأطفال',      expiry: '01 سبتمبر 2025',     active: true  },
  ];

  protected couponForm: CouponForm = this.emptyForm();

  protected openModal(): void {
    this.couponForm = this.emptyForm();
    this.showModal.set(true);
  }

  protected closeModal(): void {
    this.showModal.set(false);
  }

  protected saveCoupon(): void {
    if (!this.couponForm.code || !this.couponForm.value) {
      this.toast.warning('يرجى تعبئة الكود والقيمة');
      return;
    }
    this.toast.success('تم حفظ الكوبون بنجاح');
    this.showModal.set(false);
  }

  protected usagePercent(c: Coupon): number {
    return Math.round((c.used / c.maxUses) * 100);
  }

  private emptyForm(): CouponForm {
    return { code: '', type: 'percentage', value: null, maxUses: null, startDate: '', endDate: '', scope: 'all' };
  }
}
