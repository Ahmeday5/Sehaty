import { Routes } from '@angular/router';

export const patientsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/patients-list/patients-list.component').then(
        (m) => m.PatientsListComponent
      ),
  },
];
