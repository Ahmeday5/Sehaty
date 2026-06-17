import { Routes } from '@angular/router';

export const accessDeniedRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/access-denied-page/access-denied-page.component').then(
        (m) => m.AccessDeniedPageComponent,
      ),
  },
];
