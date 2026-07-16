import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PharmacyMainPageStats } from '../models/pharmacy-stats.model';

@Injectable({ providedIn: 'root' })
export class PharmacyStatsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/+$/, '');

  getMainPageStats(): Observable<PharmacyMainPageStats> {
    return this.http.get<PharmacyMainPageStats>(`${this.base}/api/PharmacyDashboard/stats/mainPage`);
  }
}
