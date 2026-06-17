import { Routes } from '@angular/router';

export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/all-users/all-users.component').then((m) => m.AllUsersComponent),
  },
];
