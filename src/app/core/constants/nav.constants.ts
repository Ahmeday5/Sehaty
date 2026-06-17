import { NavSection } from '../../layouts/admin/sidebar/sidebar.component';

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'الرئيسية',
    items: [
      {
        id: 'dashboard',
        label: 'لوحة التحكم',
        route: '/dashboard',
        icon: 'house',
        requiredAnyRole: ['Admin'],
      },
    ],
  },
  {
    label: 'إدارة الأطباء',
    items: [
      {
        id: 'all-doctors',
        label: 'الأطباء',
        route: '/doctors',
        icon: 'doctors',
        requiredAnyRole: ['Admin', 'Editor', 'Sales'],
      },
    ],
  },
  {
    label: 'إدارة المستخدمين',
    items: [
      {
        id: 'all-users',
        label: 'المستخدمين',
        route: '/users',
        icon: 'users',
        requiredAnyRole: ['Admin'],
      },
    ],
  },
  {
    label: 'الخدمات',
    items: [
      {
        id: 'patients',
        label: 'المرضى',
        route: '/patients',
        icon: 'patients',
        requiredAnyRole: ['Admin', 'Editor'],
      },
      {
        id: 'specialities',
        label: 'التخصصات',
        route: '/specialities',
        icon: 'specialities',
        requiredAnyRole: ['Admin', 'Editor'],
      },
      {
        id: 'discounts',
        label: 'الخصومات',
        route: '/discounts',
        icon: 'discount',
        requiredAnyRole: ['Admin', 'Sales'],
      },
    ],
  },
  {
    label: 'التسويق',
    items: [
      {
        id: 'advertisements',
        label: 'الإعلانات',
        route: '/advertisements',
        icon: 'ads',
        requiredAnyRole: ['Admin', 'Editor', 'Marketing'],
      },
      {
        id: 'notifications',
        label: 'الإشعارات',
        route: '/notifications',
        icon: 'bell',
        requiredAnyRole: ['Admin', 'Editor', 'Marketing'],
      },
    ],
  },
  {
    label: 'التقارير والإعدادات',
    items: [
      {
        id: 'reports',
        label: 'التقارير',
        route: '/reports',
        icon: 'chart',
        requiredAnyRole: ['Admin'],
      },
      {
        id: 'privacy-policy',
        label: 'سياسة الخصوصية',
        route: '/privacy-policy',
        icon: 'document',
        requiredAnyRole: ['Admin', 'Editor'],
      },
    ],
  },
];
