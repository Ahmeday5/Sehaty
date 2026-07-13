import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import { PharmaciesListParams, PharmaciesListResponse } from '../models/pharmacy.model';

@Injectable({ providedIn: 'root' })
export class PharmaciesService {
  private readonly api  = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/+$/, '');

  getPharmacies(params: PharmaciesListParams): Observable<PharmaciesListResponse> {
    let p = new HttpParams()
      .set('page',     String(params.page))
      .set('pageSize', String(params.pageSize));
    if (params.name?.trim())           p = p.set('name',  params.name.trim());
    if (params.phone?.trim())          p = p.set('phone', params.phone.trim());
    if (params.isActive !== undefined) p = p.set('isActive', String(params.isActive));

    return this.http.get<PharmaciesListResponse>(
      `${this.base}/api/Dashboard/getPharmacies`, { params: p },
    );
  }

  activatePharmacy(id: number): Observable<string> {
    return this.api.putText(`api/Dashboard/activatePharmacy/${id}`, null);
  }

  deactivatePharmacy(id: number): Observable<string> {
    return this.api.putText(`api/Dashboard/deactivatePharmacy/${id}`, null);
  }

  deletePharmacy(id: number): Observable<string> {
    return this.api.deleteText(`api/Dashboard/deletePharmacy/${id}`);
  }
}
