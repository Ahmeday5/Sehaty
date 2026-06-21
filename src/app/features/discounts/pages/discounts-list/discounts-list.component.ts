import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { DiscountsService } from '../../services/discounts.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DoctorOption } from '../../models/discount.model';

@Component({
  selector: 'app-discounts-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './discounts-list.component.html',
  styleUrl: './discounts-list.component.scss',
})
export class DiscountsListComponent implements OnInit {
  private readonly svc   = inject(DiscountsService);
  private readonly toast = inject(ToastService);

  protected readonly applying      = signal(false);
  protected readonly loadingDoctors = signal(false);
  protected readonly doctors       = signal<DoctorOption[]>([]);

  protected applyForm = {
    doctorId: '',
    date: '',
    discountPercentage: '',
  };

  ngOnInit(): void {
    this.loadDoctors();
  }

  private loadDoctors(): void {
    this.loadingDoctors.set(true);
    this.svc.getDoctors().subscribe({
      next: (list) => { this.doctors.set(list); this.loadingDoctors.set(false); },
      error: () => { this.toast.error('فشل في جلب قائمة الأطباء'); this.loadingDoctors.set(false); },
    });
  }

  protected async onApply(): Promise<void> {
    if (!this.applyForm.doctorId || !this.applyForm.date || !this.applyForm.discountPercentage) {
      this.toast.warning('يرجى تعبئة جميع الحقول');
      return;
    }
    this.applying.set(true);
    try {
      await firstValueFrom(this.svc.applyToAppointment({
        doctorId:           +this.applyForm.doctorId,
        date:               this.applyForm.date,
        discountPercentage: +this.applyForm.discountPercentage,
      }));
      this.toast.success('تم تطبيق الخصم على المواعيد بنجاح');
      this.applyForm = { doctorId: '', date: '', discountPercentage: '' };
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
