import { NavSection } from '../../layouts/admin/sidebar/sidebar.component';

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'الرئيسية',
    items: [
      {
        id: 'overview',
        label: 'نظرة عامة',
        route: '/dashboard',
        icon: 'house',
        requiredAnyRole: ['Admin'],
      },
      {
        id: 'analytics',
        label: 'التحليلات',
        route: '/reports',
        icon: 'chart',
        requiredAnyRole: ['Admin'],
      },
    ],
  },
  {
    label: 'إدارة',
    items: [
      {
        id: 'specialities',
        label: 'التخصصات',
        route: '/specialities',
        icon: 'specialities',
        requiredAnyRole: ['Admin', 'Editor'],
      },
      {
        id: 'discounts',
        label: 'الخصومات والعروض',
        route: '/discounts',
        icon: 'discount',
        requiredAnyRole: ['Admin', 'Sales'],
      },
      {
        id: 'doctors',
        label: 'الأطباء',
        route: '/doctors',
        icon: 'doctors',
        requiredAnyRole: ['Admin', 'Editor', 'Sales'],
      },
      {
        id: 'patients',
        label: 'المرضى',
        route: '/patients',
        icon: 'patients',
        requiredAnyRole: ['Admin', 'Editor'],
      },
      {
        id: 'pharmacies',
        label: 'الصيدليات',
        route: '/pharmacies',
        icon: 'pharmacy',
        requiredAnyRole: ['Admin', 'Editor'],
      },
      {
        id: 'appointments',
        label: 'الحجوزات',
        route: '/appointments',
        icon: 'calendar',
        badge: '12',
        badgeType: 'red',
        requiredAnyRole: ['Admin', 'Editor'],
      },
      {
        id: 'prescriptions',
        label: 'الوصفات',
        route: '/prescriptions',
        icon: 'prescription',
        requiredAnyRole: ['Admin', 'Editor'],
      },
    ],
  },
  {
    label: 'المالية والدعم',
    items: [
      {
        id: 'finance',
        label: 'المالية',
        route: '/finance',
        icon: 'finance',
        requiredAnyRole: ['Admin'],
      },
      {
        id: 'approvals',
        label: 'مراجعة الطلبات',
        route: '/approvals',
        icon: 'approvals',
        badge: '3',
        badgeType: 'red',
        requiredAnyRole: ['Admin', 'Editor'],
      },
      {
        id: 'support',
        label: 'الدعم الفني',
        route: '/support',
        icon: 'support',
        badge: '5',
        badgeType: 'amber',
        requiredAnyRole: ['Admin', 'Editor'],
      },
      {
        id: 'notifications',
        label: 'الإشعارات',
        route: '/notifications',
        icon: 'bell',
        requiredAnyRole: ['Admin', 'Editor', 'Marketing'],
      },
      {
        id: 'audit',
        label: 'سجل التدقيق',
        route: '/audit',
        icon: 'audit',
        requiredAnyRole: ['Admin'],
      },
    ],
  },
  {
    label: 'النظام',
    items: [
      {
        id: 'users',
        label: 'المشرفون',
        route: '/users',
        icon: 'users',
        requiredAnyRole: ['Admin'],
      },
      {
        id: 'settings',
        label: 'الإعدادات',
        route: '/settings',
        icon: 'settings',
        requiredAnyRole: ['Admin'],
      },
    ],
  },
];
