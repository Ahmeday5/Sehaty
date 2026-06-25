import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CacheService } from '../../../core/services/cache.service';
import { Pharmacy } from '../models/pharmacy.model';
import { MOCK_PHARMACIES } from './pharmacies.mock';

const CACHE_KEY    = 'pharmacies:all';
const CACHE_TTL_MS = 10 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class PharmaciesService {
  private readonly api   = inject(ApiService);
  private readonly cache = inject(CacheService);

  getAllPharmacies(): Observable<Pharmacy[]> {
    const cached = this.cache.get<Pharmacy[]>(CACHE_KEY);
    if (cached) return of(cached);

    return this.api.get<Pharmacy[]>('api/Dashboard/getAllPharmacies').pipe(
      map((res) => {
        const list: Pharmacy[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
        this.cache.set(CACHE_KEY, list, CACHE_TTL_MS);
        return list;
      }),
      catchError(() => of(MOCK_PHARMACIES)),
    );
  }

  searchByName(name: string): Observable<Pharmacy[]> {
    return this.api
      .get<Pharmacy[]>('api/Dashboard/searchByPharmacyName', { params: { name } })
      .pipe(
        map((res) => (Array.isArray(res) ? res : (res as any)?.data ?? [])),
        catchError(() => of(
          MOCK_PHARMACIES.filter((p) => p.name.includes(name) || p.ownerName.includes(name)),
        )),
      );
  }

  getPharmacyById(id: number): Observable<Pharmacy> {
    return this.api.get<Pharmacy>(`api/Dashboard/getPharmacy/${id}`);
  }

  addPharmacy(formData: FormData): Observable<string> {
    return this.api.postText('api/Dashboard/addPharmacy', formData).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  updatePharmacy(id: number, formData: FormData): Observable<string> {
    return this.api.putText(`api/Dashboard/updatePharmacy/${id}`, formData).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  deletePharmacy(id: number): Observable<string> {
    return this.api.deleteText(`api/Dashboard/deletePharmacy/${id}`).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  activatePharmacy(id: number): Observable<string> {
    return this.api.putText(`api/Dashboard/activatePharmacy/${id}`, null).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  deactivatePharmacy(id: number): Observable<string> {
    return this.api.putText(`api/Dashboard/deactivatePharmacy/${id}`, null).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  invalidate(): void { this.cache.invalidate(CACHE_KEY); }
}
