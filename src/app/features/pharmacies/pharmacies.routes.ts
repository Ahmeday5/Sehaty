import { Routes } from '@angular/router';

export const pharmaciesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/all-pharmacies/all-pharmacies.component').then(
        (m) => m.AllPharmaciesComponent,
      ),
  },
];
