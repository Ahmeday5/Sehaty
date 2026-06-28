import { Routes } from '@angular/router';

export const doctorMapRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/doctor-map/doctor-map.component').then(
        (m) => m.DoctorMapComponent,
      ),
  },
];
