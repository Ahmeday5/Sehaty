import { Routes } from '@angular/router';

export const approvalsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/approvals-home/approvals-home.component').then(
        (m) => m.ApprovalsHomeComponent,
      ),
  },
];
