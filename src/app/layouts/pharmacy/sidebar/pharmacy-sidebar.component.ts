import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../core/services/layout.service';

interface PharmacyNavItem {
  id: string;
  label: string;
  route: string;
  icon: string;
}

const PHARMACY_NAV_ITEMS: PharmacyNavItem[] = [
  { id: 'profile', label: 'الملف الشخصي', route: '/pharmacy/profile', icon: 'fa-solid fa-store' },
  { id: 'catalog', label: 'كتالوج الأصناف', route: '/pharmacy/catalog', icon: 'fa-solid fa-pills' },
  { id: 'orders', label: 'إدارة الطلبات', route: '/pharmacy/orders', icon: 'fa-solid fa-cart-shopping' },
];

@Component({
  selector: 'app-pharmacy-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pharmacy-sidebar.component.html',
  styleUrl: './pharmacy-sidebar.component.scss',
})
export class PharmacySidebarComponent {
  protected readonly layout = inject(LayoutService);
  protected readonly items = PHARMACY_NAV_ITEMS;
}
