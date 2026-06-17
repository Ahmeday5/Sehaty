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
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'app-discounts-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './discounts-list.component.html',
  styleUrl: './discounts-list.component.scss',
})
export class DiscountsListComponent implements OnInit {
  private readonly svc = inject(DiscountsService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly loading = signal(false);
  protected readonly adding = signal(false);
  protected readonly discounts = signal<any[]>([]);
  protected readonly lastUpdate = signal<Date | null>(null);

  protected newDiscount = {
    code: '',
    percentage: '',
    description: '',
    expiryDate: '',
  };

  ngOnInit(): void {
    this.load();
  }

  protected refresh(): void {
    this.svc.invalidate();
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (res) => {
        this.discounts.set(res);
        this.lastUpdate.set(new Date());
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('فشل تحميل الخصومات');
        this.loading.set(false);
      },
    });
  }

  protected async onAdd(): Promise<void> {
    if (!this.newDiscount.code.trim() || !this.newDiscount.percentage) {
      this.toast.warning('يرجى إدخال الكود والنسبة المئوية');
      return;
    }
    this.adding.set(true);
    try {
      const fd = new FormData();
      Object.entries(this.newDiscount).forEach(([k, v]) => {
        if (v) fd.append(k, String(v));
      });
      await firstValueFrom(this.svc.add(fd));
      this.toast.success('تم إضافة الخصم');
      this.newDiscount = {
        code: '',
        percentage: '',
        description: '',
        expiryDate: '',
      };
      this.load();
    } catch (e: any) {
      this.toast.error(e?.message ?? 'فشل الإضافة');
    } finally {
      this.adding.set(false);
    }
  }

  protected async onDelete(id: number, code: string): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'حذف خصم',
      message: `هل تريد حذف الخصم "${code}"؟`,
      confirmText: 'حذف',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.svc.delete(id));
      this.toast.success('تم حذف الخصم');
      this.load();
    } catch (e: any) {
      this.toast.error(e?.message ?? 'فشل الحذف');
    }
  }
}
