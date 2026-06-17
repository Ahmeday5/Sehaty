import { Routes } from '@angular/router';

export const specialitiesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/specialities-list/specialities-list.component').then(
        (m) => m.SpecialitiesListComponent
      ),
  },
];
