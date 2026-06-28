import { Routes } from '@angular/router';

export const ratingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/ratings/ratings.component').then(
        (m) => m.RatingsComponent,
      ),
  },
];
