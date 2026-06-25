import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutoDiscount } from '../../models/discount.model';

@Component({
  selector: 'app-auto-discounts',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auto-discounts.component.html',
  styleUrl: './auto-discounts.component.scss',
})
export class AutoDiscountsComponent {
  protected readonly items = signal<AutoDiscount[]>([
    {
      id: 1,
      emoji: '🎁',
      title: 'أول حجز مجاني للمريض الجديد',
      description: 'يحصل المريض الجديد على أول حجز بخصم 100% كاستقبال ترحيبي.',
      value: '100%',
      badgeVariant: 'amber',
      enabled: true,
    },
    {
      id: 2,
      emoji: '⏰',
      title: 'خصم 10% عند الحجز مسبقاً بـ 48 ساعة',
      description: 'تطبيق خصم تلقائي عند الحجز قبل الموعد بـ 48 ساعة على الأقل.',
      value: '10%',
      badgeVariant: 'primary',
      enabled: true,
    },
    {
      id: 3,
      emoji: '🔄',
      title: 'الحجز الثالث بخصم 15%',
      description: 'يحصل المريض تلقائياً على خصم 15% في كل حجزه الثالث مكافأةً على الولاء.',
      value: '15%',
      badgeVariant: 'green',
      enabled: false,
    },
  ]);

  protected toggle(id: number): void {
    this.items.update((list) =>
      list.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item)
    );
  }
}
