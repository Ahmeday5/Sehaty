import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { CacheService } from '../../../core/services/cache.service';
import { Speciality, SpecialityPayload, AddSpecialityResponse } from '../models/speciality.model';
import { environment } from '../../../../environments/environment';

const TTL = 10 * 60 * 1000;
const KEY = 'specialities:all';

@Injectable({ providedIn: 'root' })
export class SpecialitiesService {
  private readonly http  = inject(HttpClient);
  private readonly api   = inject(ApiService);
  private readonly cache = inject(CacheService);
  private readonly base  = environment.apiUrl.replace(/\/+$/, '');

  // Bypasses ApiService.unwrap() — response is a plain array, not wrapped
  getAll(): Observable<Speciality[]> {
    const cached = this.cache.get<Speciality[]>(KEY);
    if (cached) return of(cached);
    return this.http.get<Speciality[]>(`${this.base}/api/Dashboard/getAllSpecialities`).pipe(
      tap((list) => this.cache.set(KEY, list, TTL)),
    );
  }

  add(payload: SpecialityPayload): Observable<AddSpecialityResponse> {
    return this.http.post<AddSpecialityResponse>(
      `${this.base}/api/Dashboard/addSpecialty`, payload
    ).pipe(tap(() => this.invalidate()));
  }

  update(id: number, payload: SpecialityPayload): Observable<AddSpecialityResponse> {
    return this.http.put<AddSpecialityResponse>(
      `${this.base}/api/Dashboard/updateSpecialty/${id}`, payload
    ).pipe(tap(() => this.invalidate()));
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.base}/api/Dashboard/deleteSpecialty/${id}`
    ).pipe(tap(() => this.invalidate()));
  }

  invalidate(): void { this.cache.invalidate(KEY); }
}
