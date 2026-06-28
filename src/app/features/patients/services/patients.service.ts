import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PatientsListParams, PatientsResponse } from '../models/patient.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private readonly http = inject(HttpClient);
  private readonly api  = inject(ApiService);
  private readonly base = environment.apiUrl.replace(/\/+$/, '');

  // Unified endpoint — supports name + phoneNumber search + pagination
  getPatients(params: PatientsListParams): Observable<PatientsResponse> {
    let p = new HttpParams()
      .set('page',     String(params.page))
      .set('pageSize', String(params.pageSize));
    if (params.name?.trim())        p = p.set('name',        params.name.trim());
    if (params.phoneNumber?.trim()) p = p.set('phoneNumber', params.phoneNumber.trim());

    return this.http.get<PatientsResponse>(
      `${this.base}/api/Dashboard/getPatients`, { params: p }
    );
  }

  deletePatient(id: number): Observable<string> {
    return this.api.deleteText(`api/Dashboard/deletePatient/${id}`);
  }
}
