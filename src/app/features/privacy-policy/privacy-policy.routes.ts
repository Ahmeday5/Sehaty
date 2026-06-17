import { Routes } from '@angular/router';

export const privacyPolicyRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/privacy-policy/privacy-policy.component').then(
        (m) => m.PrivacyPolicyComponent
      ),
  },
];
