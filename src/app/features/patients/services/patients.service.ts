import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PatientsResponse } from '../models/patient.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private readonly http = inject(HttpClient);
  private readonly api  = inject(ApiService);
  private readonly base = environment.apiUrl.replace(/\/+$/, '');

  // Use HttpClient directly to bypass ApiService.unwrap(), which would
  // strip the wrapper object and return only the `data` array.
  getAll(page = 1, pageSize = 10): Observable<PatientsResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<PatientsResponse>(
      `${this.base}/api/Dashboard/getAllPatients`, { params }
    );
  }

  searchByName(name: string, page = 1, pageSize = 10): Observable<PatientsResponse> {
    const params = new HttpParams()
      .set('name', name)
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<PatientsResponse>(
      `${this.base}/api/Dashboard/searchPatientsByName`, { params }
    );
  }

  deletePatient(id: number): Observable<string> {
    return this.api.deleteText(`api/Dashboard/deletePatient/${id}`);
  }
}
