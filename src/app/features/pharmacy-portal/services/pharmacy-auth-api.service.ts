import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  PharmacyLoginCredentials,
  PharmacyRegisterPayload,
  PharmacySession,
} from '../../../core/models/pharmacy-auth.model';

@Injectable({ providedIn: 'root' })
export class PharmacyAuthApiService {
  private readonly api = inject(ApiService);

  login(credentials: PharmacyLoginCredentials): Observable<PharmacySession> {
    return this.api.post<PharmacySession>('api/Pharmacy/login', credentials);
  }

  register(payload: PharmacyRegisterPayload): Observable<PharmacySession> {
    const form = new FormData();
    form.append('Name', payload.name);
    form.append('Password', payload.password);
    form.append('Phone', payload.phone);
    form.append('Address', payload.address);
    if (payload.lat) form.append('Lat', payload.lat);
    if (payload.lng) form.append('Lng', payload.lng);
    if (payload.image) form.append('Image', payload.image);
    if (payload.deviceToken) form.append('DeviceToken', payload.deviceToken);
    return this.api.post<PharmacySession>('api/Pharmacy/register', form);
  }

  logout(): Observable<unknown> {
    return this.api.post('api/Pharmacy/logout', {});
  }

  getProfile(): Observable<PharmacySession> {
    return this.api.get<PharmacySession>('api/Pharmacy/profile');
  }
}
