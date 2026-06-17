import { Routes } from '@angular/router';

export const splashRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/splash-page/splash-page.component').then(
        (m) => m.SplashPageComponent,
      ),
  },
];
