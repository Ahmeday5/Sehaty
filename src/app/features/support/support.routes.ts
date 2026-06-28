import { Routes } from '@angular/router';

export const supportRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/support-home/support-home.component').then(
        (m) => m.SupportHomeComponent,
      ),
  },
];
