import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { CacheService } from '../../../core/services/cache.service';
import { AppointmentsReport, ReportFilters } from '../models/report.model';

const TTL = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly api   = inject(ApiService);
  private readonly cache = inject(CacheService);

  getAppointments(filters: ReportFilters = {}): Observable<AppointmentsReport> {
    const params: Record<string, unknown> = { ...filters };
    const key = 'reports:appointments:' + JSON.stringify(params);

    const cached = this.cache.get<AppointmentsReport>(key);
    if (cached) return of(cached);

    return this.api.get<AppointmentsReport>('api/Dashboard/getAppointmentsReport', { params }).pipe(
      tap((res) => this.cache.set(key, res, TTL)),
    );
  }

  invalidate(): void { this.cache.invalidate('reports'); }
}
