import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DashboardStats } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  getStats(): Observable<DashboardStats> {
    return forkJoin({
      totalProfit:       this.api.get<{ total: number }>('api/Dashboard/getTotalProfit'),
      profitToday:       this.api.get<{ total: number }>('api/Dashboard/getProfitToday'),
      totalAppointments: this.api.get<{ total: number }>('api/Dashboard/getTotalAppointmentsCount'),
      todayAppointments: this.api.get<{ total: number }>('api/Dashboard/getTodayAppointmentsCount'),
      totalPatients:     this.api.get<{ total: number }>('api/Dashboard/getTotalPatientsCount'),
      todayPatients:     this.api.get<{ total: number }>('api/Dashboard/getTodayPatientsCount'),
    }).pipe(
      map((res) => ({
        totalProfit:       res.totalProfit?.total       ?? 0,
        profitToday:       res.profitToday?.total       ?? 0,
        totalAppointments: res.totalAppointments?.total ?? 0,
        todayAppointments: res.todayAppointments?.total ?? 0,
        totalPatients:     res.totalPatients?.total     ?? 0,
        todayPatients:     res.todayPatients?.total     ?? 0,
      })),
    );
  }
}
