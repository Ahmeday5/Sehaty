import { Routes } from '@angular/router';

export const doctorsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/all-doctors/all-doctors.component').then((m) => m.AllDoctorsComponent),
  },
  {
    path: ':id/details',
    loadComponent: () =>
      import('./pages/doctor-details/doctor-details.component').then((m) => m.DoctorDetailsComponent),
  },
];
