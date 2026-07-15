import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PharmacyLoginCredentials, PharmacySession } from '../../../core/models/pharmacy-auth.model';

@Injectable({ providedIn: 'root' })
export class PharmacyAuthApiService {
  private readonly api = inject(ApiService);

  login(credentials: PharmacyLoginCredentials): Observable<PharmacySession> {
    return this.api.post<PharmacySession>('api/Pharmacy/login', credentials);
  }

  logout(): Observable<unknown> {
    return this.api.post('api/Pharmacy/logout', {});
  }

  getProfile(): Observable<PharmacySession> {
    return this.api.get<PharmacySession>('api/Pharmacy/profile');
  }
}
