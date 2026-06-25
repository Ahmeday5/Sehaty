import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CacheService } from '../../../core/services/cache.service';
import { Prescription, PrescriptionSource, PrescriptionStatus } from '../models/prescription.model';
import { MOCK_PRESCRIPTIONS } from './prescriptions.mock';

const CACHE_KEY    = 'prescriptions:all';
const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class PrescriptionsService {
  private readonly api   = inject(ApiService);
  private readonly cache = inject(CacheService);

  getAll(): Observable<Prescription[]> {
    const cached = this.cache.get<Prescription[]>(CACHE_KEY);
    if (cached) return of(cached);

    return this.api.get<Prescription[]>('api/Dashboard/getAllPrescriptions').pipe(
      map((res) => {
        const list: Prescription[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
        this.cache.set(CACHE_KEY, list, CACHE_TTL_MS);
        return list;
      }),
      catchError(() => of(MOCK_PRESCRIPTIONS)),
    );
  }

  getFiltered(status?: PrescriptionStatus | null, source?: PrescriptionSource | null): Observable<Prescription[]> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    if (source) params['source'] = source;

    return this.api.get<Prescription[]>('api/Dashboard/getPrescriptions', { params }).pipe(
      map((res) => (Array.isArray(res) ? res : (res as any)?.data ?? [])),
    );
  }

  getById(id: number): Observable<Prescription> {
    return this.api.get<Prescription>(`api/Dashboard/getPrescription/${id}`);
  }

  updateStatus(id: number, status: PrescriptionStatus): Observable<string> {
    return this.api.putText(`api/Dashboard/updatePrescriptionStatus/${id}`, { status }).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  invalidate(): void { this.cache.invalidate(CACHE_KEY); }
}
