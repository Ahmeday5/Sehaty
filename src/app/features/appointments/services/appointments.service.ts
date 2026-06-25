import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CacheService } from '../../../core/services/cache.service';
import { Appointment, AppointmentFilters } from '../models/appointment.model';
import { MOCK_APPOINTMENTS } from './appointments.mock';

const CACHE_KEY    = 'appointments:all';
const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly api   = inject(ApiService);
  private readonly cache = inject(CacheService);

  getAll(): Observable<Appointment[]> {
    const cached = this.cache.get<Appointment[]>(CACHE_KEY);
    if (cached) return of(cached);

    return this.api.get<Appointment[]>('api/Dashboard/getAllAppointments').pipe(
      map((res) => {
        const list: Appointment[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
        this.cache.set(CACHE_KEY, list, CACHE_TTL_MS);
        return list;
      }),
      catchError(() => of(MOCK_APPOINTMENTS)),
    );
  }

  getFiltered(filters: AppointmentFilters): Observable<Appointment[]> {
    const params: Record<string, string> = {};
    if (filters.status)   params['status']   = filters.status;
    if (filters.search)   params['search']   = filters.search;
    if (filters.dateFrom) params['dateFrom'] = filters.dateFrom;
    if (filters.dateTo)   params['dateTo']   = filters.dateTo;

    return this.api.get<Appointment[]>('api/Dashboard/getAppointments', { params }).pipe(
      map((res) => (Array.isArray(res) ? res : (res as any)?.data ?? [])),
    );
  }

  getById(id: number): Observable<Appointment> {
    return this.api.get<Appointment>(`api/Dashboard/getAppointment/${id}`);
  }

  cancel(id: number): Observable<string> {
    return this.api.putText(`api/Dashboard/cancelAppointment/${id}`, null).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  invalidate(): void { this.cache.invalidate(CACHE_KEY); }
}
