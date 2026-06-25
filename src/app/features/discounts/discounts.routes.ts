import { Routes } from '@angular/router';

export const discountsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/discounts-shell/discounts-shell.component').then(
        (m) => m.DiscountsShellComponent
      ),
  },
];
