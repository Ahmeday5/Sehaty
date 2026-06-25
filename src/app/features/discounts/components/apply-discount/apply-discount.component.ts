import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { DiscountsService } from '../../services/discounts.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DoctorOption } from '../../models/discount.model';

@Component({
  selector: 'app-apply-discount',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './apply-discount.component.html',
  styleUrl: './apply-discount.component.scss',
})
export class ApplyDiscountComponent implements OnInit {
  private readonly svc   = inject(DiscountsService);
  private readonly toast = inject(ToastService);

  protected readonly applying       = signal(false);
  protected readonly loadingDoctors = signal(false);
  protected readonly doctors        = signal<DoctorOption[]>([]);

  protected readonly doctorId           = signal('');
  protected readonly date               = signal('');
  protected readonly discountPercentage = signal('');

  protected readonly showSlots = computed(() => !!this.doctorId() && !!this.date());

  protected readonly quickChips = [10, 15, 20, 25, 30, 50, 100];

  ngOnInit(): void {
    this.loadingDoctors.set(true);
    this.svc.getDoctors().subscribe({
      next:  (list) => { this.doctors.set(list); this.loadingDoctors.set(false); },
      error: ()     => { this.toast.error('فشل في جلب قائمة الأطباء'); this.loadingDoctors.set(false); },
    });
  }

  protected setChip(val: number): void {
    this.discountPercentage.set(String(val));
  }

  protected async onApply(): Promise<void> {
    if (!this.doctorId() || !this.date() || !this.discountPercentage()) {
      this.toast.warning('يرجى تعبئة جميع الحقول');
      return;
    }
    this.applying.set(true);
    try {
      await firstValueFrom(this.svc.applyToAppointment({
        doctorId:           +this.doctorId(),
        date:               this.date(),
        discountPercentage: +this.discountPercentage(),
      }));
      this.toast.success('تم تطبيق الخصم على المواعيد بنجاح');
      this.doctorId.set('');
      this.date.set('');
      this.discountPercentage.set('');
    } catch (e: any) {
      const msg: string = e?.error ?? e?.message ?? '';
      if (msg.toLowerCase().includes('no availability')) {
        this.toast.warning('لا توجد مواعيد متاحة للتاريخ المحدد');
      } else {
        this.toast.error(msg || 'فشل تطبيق الخصم');
      }
    } finally {
      this.applying.set(false);
    }
  }
}
