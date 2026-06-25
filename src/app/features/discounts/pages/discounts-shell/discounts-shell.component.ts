import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiscountTab } from '../../models/discount.model';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { TabsNavComponent } from '../../../../shared/components/tabs-nav/tabs-nav.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';
import { TabDef } from '../../../../shared/components/tabs-nav/tabs-nav.model';
import { ApplyDiscountComponent } from '../../components/apply-discount/apply-discount.component';
import { CouponsListComponent } from '../../components/coupons-list/coupons-list.component';
import { AutoDiscountsComponent } from '../../components/auto-discounts/auto-discounts.component';
import { PackagesComponent } from '../../components/packages/packages.component';

@Component({
  selector: 'app-discounts-shell',
  standalone: true,
  imports: [
    CommonModule,
    KpiStripComponent,
    TabsNavComponent,
    ApplyDiscountComponent,
    CouponsListComponent,
    AutoDiscountsComponent,
    PackagesComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './discounts-shell.component.html',
  styleUrl: './discounts-shell.component.scss',
})
export class DiscountsShellComponent {
  protected readonly activeTab = signal<DiscountTab>('apply');

  protected readonly kpiItems: readonly KpiItem[] = [
    { icon: 'fa-solid fa-fire-flame-curved', value: '12',       label: 'عروض نشطة',       variant: 'amber'   },
    { icon: 'fa-solid fa-ticket',            value: '348',      label: 'استخدام الكوبونات', variant: 'primary' },
    { icon: 'fa-solid fa-money-bill-wave',   value: '5,240 ج.م', label: 'قيمة الخصومات',   variant: 'green'   },
    { icon: 'fa-solid fa-calendar-xmark',   value: '4',        label: 'عروض منتهية',      variant: 'red'     },
  ];

  protected readonly tabs: TabDef[] = [
    { id: 'apply',    label: 'تطبيق خصم',     icon: 'fa-solid fa-percent'   },
    { id: 'coupons',  label: 'كوبونات',        icon: 'fa-solid fa-ticket'    },
    { id: 'auto',     label: 'خصومات تلقائية', icon: 'fa-solid fa-robot'     },
    { id: 'packages', label: 'باقات',          icon: 'fa-solid fa-box-open'  },
  ];

  protected setTab(tab: string): void {
    this.activeTab.set(tab as DiscountTab);
  }
}
