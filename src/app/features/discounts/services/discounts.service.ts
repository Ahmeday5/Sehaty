import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { CacheService } from '../../../core/services/cache.service';
import { Discount } from '../models/discount.model';

const TTL = 10 * 60 * 1000;
const KEY = 'discounts:all';

@Injectable({ providedIn: 'root' })
export class DiscountsService {
  private readonly api   = inject(ApiService);
  private readonly cache = inject(CacheService);

  getAll(): Observable<Discount[]> {
    const cached = this.cache.get<Discount[]>(KEY);
    if (cached) return of(cached);
    return this.api.get<Discount[]>('api/Dashboard/getAllDiscounts').pipe(
      tap((list) => this.cache.set(KEY, list, TTL)),
    );
  }

  add(data: FormData): Observable<string> {
    return this.api.postText('api/Dashboard/addDiscount', data).pipe(
      tap(() => this.invalidate()),
    );
  }

  delete(id: number): Observable<string> {
    return this.api.deleteText(`api/Dashboard/deleteDiscount/${id}`).pipe(
      tap(() => this.invalidate()),
    );
  }

  invalidate(): void { this.cache.invalidate(KEY); }
}
