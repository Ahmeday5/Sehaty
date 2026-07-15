import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PharmacyAuthService } from '../services/pharmacy-auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

let isHandling401 = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const pharmacyAuthService = inject(PharmacyAuthService);
  const router = inject(Router);

  const isPharmacyRoute = router.url.startsWith('/pharmacy');
  const token = isPharmacyRoute ? pharmacyAuthService.getToken() : authService.getToken();

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isHandling401) {
        isHandling401 = true;
        if (isPharmacyRoute) {
          pharmacyAuthService.logout();
          router.navigate(['/pharmacy/login']).finally(() => { isHandling401 = false; });
        } else {
          authService.logout();
          router.navigate(['/login']).finally(() => { isHandling401 = false; });
        }
      }

      return throwError(() => error);
    }),
  );
};
