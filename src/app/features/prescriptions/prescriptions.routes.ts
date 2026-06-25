import { Routes } from '@angular/router';

export const prescriptionsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/prescriptions-list/prescriptions-list.component').then(
        (m) => m.PrescriptionsListComponent,
      ),
  },
];
