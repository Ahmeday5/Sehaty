import { Routes } from '@angular/router';

export const appointmentsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/appointments-list/appointments-list.component').then(
        (m) => m.AppointmentsListComponent,
      ),
  },
];
