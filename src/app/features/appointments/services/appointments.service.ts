import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  AppointmentFilters,
  AppointmentItem,
  AppointmentsPage,
  AppointmentStatusOption,
} from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly api = inject(ApiService);

  getAppointments(filters: AppointmentFilters): Observable<AppointmentsPage> {
    const params: Record<string, string> = {
      page:     String(filters.page),
      pageSize: String(filters.pageSize),
    };
    if (filters.doctorName?.trim())  params['doctorName']  = filters.doctorName.trim();
    if (filters.patientName?.trim()) params['patientName'] = filters.patientName.trim();
    if (filters.status)              params['status']      = filters.status;
    if (filters.date)                params['date']        = filters.date;

    return this.api.get<any>('api/Dashboard/getAppointments', { params }).pipe(
      map((res) => {
        const items: AppointmentItem[] = Array.isArray(res)
          ? res
          : (res?.data ?? res?.appointments ?? []);
        const total: number = res?.totalCount ?? res?.total ?? items.length;
        return {
          data:       items,
          totalCount: total,
          page:       filters.page,
          pageSize:   filters.pageSize,
        } as AppointmentsPage;
      }),
    );
  }

  getStatuses(): Observable<AppointmentStatusOption[]> {
    return this.api.get<any>('api/Dashboard/getAppointmentStatuses').pipe(
      map((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        return list as AppointmentStatusOption[];
      }),
    );
  }
}
