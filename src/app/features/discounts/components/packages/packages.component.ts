import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalPackage } from '../../models/discount.model';

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './packages.component.html',
  styleUrl: './packages.component.scss',
})
export class PackagesComponent {
  protected readonly packages: readonly MedicalPackage[] = [
    {
      id: 1,
      emoji: '❤️',
      title: 'باقة متابعة القلب',
      subtitle: '4 جلسات متابعة قلبية',
      price: 900,
      originalPrice: 1200,
      features: [
        '4 جلسات متابعة مع طبيب قلب',
        'تقرير صحي شامل بعد كل جلسة',
        'أولوية في الحجز',
      ],
      bannerVariant: 'heart',
    },
    {
      id: 2,
      emoji: '👨‍👩‍👧‍👦',
      title: 'باقة صحة الأسرة',
      subtitle: '6 جلسات لأفراد الأسرة',
      price: 1100,
      originalPrice: 1560,
      features: [
        '6 جلسات موزَّعة بين أفراد الأسرة',
        'خصم إضافي 5% عند التجديد',
        'استشارة نصية مجانية',
      ],
      bannerVariant: 'family',
    },
  ];

  protected savingPercent(pkg: MedicalPackage): number {
    return Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100);
  }
}
