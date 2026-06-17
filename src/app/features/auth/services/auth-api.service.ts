import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { LoginCredentials, User } from '../../../core/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly api = inject(ApiService);

  login(credentials: LoginCredentials): Observable<User> {
    return this.api.post<User>('api/Dashboard/loginEmployee', credentials);
  }
}
