import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  MainPageStatsResponse,
  RevenueChartResponse,
  RevenueChartType,
  SpecialtyDistributionResponse,
  LatestAppointmentsResponse,
  ActivityLogResponse,
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  getMainPageStats(): Observable<MainPageStatsResponse> {
    return this.api.get<MainPageStatsResponse>('api/Dashboard/getMainPageStats');
  }

  getRevenueChart(type: RevenueChartType = 'monthly', count = 8): Observable<RevenueChartResponse> {
    return this.api.get<RevenueChartResponse>('api/dashboard/getRevenueChart', {
      params: { type, count },
    });
  }

  getSpecialtyDistribution(): Observable<SpecialtyDistributionResponse> {
    return this.api.get<SpecialtyDistributionResponse>('api/Dashboard/getSpecialtyDistribution');
  }

  getLatestAppointments(count = 10): Observable<LatestAppointmentsResponse> {
    return this.api.get<LatestAppointmentsResponse>('api/Dashboard/getLatestAppointments', {
      params: { count },
    });
  }

  getActivityLog(hours = 24, count = 20): Observable<ActivityLogResponse> {
    return this.api.get<ActivityLogResponse>('api/Dashboard/getActivityLog', {
      params: { hours, count },
    });
  }
}
