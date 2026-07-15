import { Routes } from '@angular/router';
import { pharmacyGuestGuard } from '../../core/guards/pharmacy-guest.guard';
import { pharmacyAuthGuard } from '../../core/guards/pharmacy-auth.guard';

export const pharmacyPortalRoutes: Routes = [
  {
    path: 'login',
    canActivate: [pharmacyGuestGuard],
    loadComponent: () =>
      import('./pages/login/pharmacy-login.component').then(
        (m) => m.PharmacyLoginComponent,
      ),
  },
  {
    path: '',
    canActivate: [pharmacyAuthGuard],
    loadComponent: () =>
      import('../../layouts/pharmacy/pharmacy-layout.component').then(
        (m) => m.PharmacyLayoutComponent,
      ),
    children: [
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/pharmacy-profile.component').then(
            (m) => m.PharmacyProfileComponent,
          ),
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./pages/catalog/pharmacy-catalog.component').then(
            (m) => m.PharmacyCatalogComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders/pharmacy-orders.component').then(
            (m) => m.PharmacyOrdersComponent,
          ),
      },
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
    ],
  },
];
