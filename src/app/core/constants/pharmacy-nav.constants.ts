export interface PharmacyNavItem {
  id: string;
  label: string;
  route: string;
  icon: string;
}

export interface PharmacyNavSection {
  label: string;
  items: PharmacyNavItem[];
}

/** Mirrors the admin sidebar's sectioned layout (NAV_SECTIONS) for visual parity. */
export const PHARMACY_NAV_SECTIONS: PharmacyNavSection[] = [
  {
    label: 'الرئيسية',
    items: [
      { id: 'dashboard', label: 'لوحة التحكم', route: '/pharmacy/dashboard', icon: 'fa-solid fa-gauge-high' },
    ],
  },
  {
    label: 'الإدارة',
    items: [
      { id: 'catalog', label: 'كتالوج الأصناف', route: '/pharmacy/catalog', icon: 'fa-solid fa-pills' },
      { id: 'orders', label: 'إدارة الطلبات', route: '/pharmacy/orders', icon: 'fa-solid fa-cart-shopping' },
      { id: 'prescriptions', label: 'مراجعة الروشتات', route: '/pharmacy/prescriptions', icon: 'fa-solid fa-file-prescription' },
    ],
  },
];
