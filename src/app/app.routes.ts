import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // ── Splash ─────────────────────────────────────────────────────────────────
  {
    path: 'splash',
    loadChildren: () =>
      import('./features/splash/splash.routes').then((m) => m.splashRoutes),
  },

  // ── Access denied ───────────────────────────────────────────────────────────
  {
    path: 'access-denied',
    loadChildren: () =>
      import('./features/access-denied/access-denied.routes').then(
        (m) => m.accessDeniedRoutes,
      ),
  },

  // ── Auth layout (unauthenticated) ───────────────────────────────────────────
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layouts/auth/auth-layout.component').then(
        (m) => m.AuthLayoutComponent,
      ),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then(
            (m) => m.LoginComponent,
          ),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // ── Admin layout (authenticated) ────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/admin/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard(['Admin'])],
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(
            (m) => m.dashboardRoutes,
          ),
      },
      {
        path: 'doctors',
        canActivate: [roleGuard(['Admin', 'Editor', 'Sales'])],
        loadChildren: () =>
          import('./features/doctors/doctors.routes').then(
            (m) => m.doctorsRoutes,
          ),
      },
      {
        path: 'users',
        canActivate: [roleGuard(['Admin'])],
        loadChildren: () =>
          import('./features/users/users.routes').then((m) => m.usersRoutes),
      },
      {
        path: 'patients',
        canActivate: [roleGuard(['Admin', 'Editor'])],
        loadChildren: () =>
          import('./features/patients/patients.routes').then(
            (m) => m.patientsRoutes,
          ),
      },
      {
        path: 'specialities',
        canActivate: [roleGuard(['Admin', 'Editor'])],
        loadChildren: () =>
          import('./features/specialities/specialities.routes').then(
            (m) => m.specialitiesRoutes,
          ),
      },
      {
        path: 'discounts',
        canActivate: [roleGuard(['Admin', 'Sales'])],
        loadChildren: () =>
          import('./features/discounts/discounts.routes').then(
            (m) => m.discountsRoutes,
          ),
      },
      {
        path: 'appointments',
        canActivate: [roleGuard(['Admin', 'Editor'])],
        loadChildren: () =>
          import('./features/appointments/appointments.routes').then(
            (m) => m.appointmentsRoutes,
          ),
      },
      {
        path: 'prescriptions',
        canActivate: [roleGuard(['Admin', 'Editor'])],
        loadChildren: () =>
          import('./features/prescriptions/prescriptions.routes').then(
            (m) => m.prescriptionsRoutes,
          ),
      },
      {
        path: 'pharmacies',
        canActivate: [roleGuard(['Admin', 'Editor'])],
        loadChildren: () =>
          import('./features/pharmacies/pharmacies.routes').then(
            (m) => m.pharmaciesRoutes,
          ),
      },
      {
        path: 'advertisements',
        canActivate: [roleGuard(['Admin', 'Editor', 'Marketing'])],
        loadChildren: () =>
          import('./features/advertisements/advertisements.routes').then(
            (m) => m.advertisementsRoutes,
          ),
      },
      {
        path: 'notifications',
        canActivate: [roleGuard(['Admin', 'Editor', 'Marketing'])],
        loadChildren: () =>
          import('./features/notifications/notifications.routes').then(
            (m) => m.notificationsRoutes,
          ),
      },
      {
        path: 'reports',
        canActivate: [roleGuard(['Admin'])],
        loadChildren: () =>
          import('./features/reports/reports.routes').then(
            (m) => m.reportsRoutes,
          ),
      },
      {
        path: 'privacy-policy',
        canActivate: [roleGuard(['Admin', 'Editor'])],
        loadChildren: () =>
          import('./features/privacy-policy/privacy-policy.routes').then(
            (m) => m.privacyPolicyRoutes,
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ── Fallback ────────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '/splash' },
];
