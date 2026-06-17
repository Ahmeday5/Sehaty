import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { CacheService } from '../../../core/services/cache.service';
import { Advertisement, AdvertisementsResponse } from '../models/advertisement.model';
import { environment } from '../../../../environments/environment';

const TTL = 5 * 60 * 1000;
const KEY  = 'advertisements:all';

@Injectable({ providedIn: 'root' })
export class AdvertisementsService {
  private readonly http  = inject(HttpClient);
  private readonly api   = inject(ApiService);
  private readonly cache = inject(CacheService);
  private readonly base  = environment.apiUrl.replace(/\/+$/, '');

  // Bypasses ApiService.unwrap() — response is a paginated wrapper, not a plain array
  getAll(page = 1, pageSize = 50): Observable<Advertisement[]> {
    const cacheKey = `${KEY}:${page}:${pageSize}`;
    const cached   = this.cache.get<Advertisement[]>(cacheKey);
    if (cached) return of(cached);

    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http
      .get<AdvertisementsResponse>(`${this.base}/api/Dashboard/getAllAdvertisements`, { params })
      .pipe(
        map((res) => res?.data ?? []),
        tap((list) => this.cache.set(cacheKey, list, TTL)),
      );
  }

  // add uses FormData with Title + ImageFile — keep using ApiService.postText
  add(data: FormData): Observable<string> {
    return this.api.postText('api/Dashboard/addAdvertisement', data).pipe(
      tap(() => this.invalidate()),
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.base}/api/Dashboard/deleteAdvertisement/${id}`
    ).pipe(tap(() => this.invalidate()));
  }

  invalidate(): void { this.cache.invalidate(KEY); }
}
