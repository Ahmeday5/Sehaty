import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/settings-home/settings-home.component').then(
        (m) => m.SettingsHomeComponent,
      ),
  },
];
