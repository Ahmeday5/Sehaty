import { Routes } from '@angular/router';

export const discountsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/discounts-list/discounts-list.component').then(
        (m) => m.DiscountsListComponent
      ),
  },
];
