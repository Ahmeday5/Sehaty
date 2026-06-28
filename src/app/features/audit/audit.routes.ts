import { Routes } from '@angular/router';

export const auditRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/audit-home/audit-home.component').then(
        (m) => m.AuditHomeComponent,
      ),
  },
];
