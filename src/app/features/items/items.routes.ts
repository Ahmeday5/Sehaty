import { Routes } from '@angular/router';

export const itemsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/all-items/all-items.component').then(
        (m) => m.AllItemsComponent,
      ),
  },
];
