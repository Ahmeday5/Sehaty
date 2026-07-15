import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PharmacyAuthService } from '../services/pharmacy-auth.service';

export const pharmacyAuthGuard: CanActivateFn = () => {
  const pharmacyAuth = inject(PharmacyAuthService);
  const router = inject(Router);
  return pharmacyAuth.isLoggedIn() ? true : router.createUrlTree(['/pharmacy/login']);
};
