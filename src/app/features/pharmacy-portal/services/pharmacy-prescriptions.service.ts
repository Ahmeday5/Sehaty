import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateOrderFromPrescriptionPayload,
  CreateOrderFromPrescriptionResponse,
  Prescription,
  PrescriptionsListParams,
  PrescriptionsListResponse,
  ReviewPrescriptionPayload,
  ReviewPrescriptionResponse,
} from '../models/prescription.model';

@Injectable({ providedIn: 'root' })
export class PharmacyPrescriptionsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/+$/, '');

  getPrescriptions(params: PrescriptionsListParams): Observable<PrescriptionsListResponse> {
    let p = new HttpParams()
      .set('page', String(params.page))
      .set('pageSize', String(params.pageSize));
    if (params.status !== undefined) p = p.set('status', String(params.status));

    return this.http.get<PrescriptionsListResponse>(`${this.base}/api/PharmacyDashboard/prescriptions`, { params: p });
  }

  getPrescription(id: number): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.base}/api/PharmacyDashboard/prescriptions/${id}`);
  }

  reviewPrescription(id: number, payload: ReviewPrescriptionPayload): Observable<ReviewPrescriptionResponse> {
    return this.http.put<ReviewPrescriptionResponse>(
      `${this.base}/api/PharmacyDashboard/prescriptions/${id}/review`, payload,
    );
  }

  createOrderFromPrescription(
    id: number,
    payload: CreateOrderFromPrescriptionPayload,
  ): Observable<CreateOrderFromPrescriptionResponse> {
    return this.http.post<CreateOrderFromPrescriptionResponse>(
      `${this.base}/api/PharmacyDashboard/prescriptions/${id}/createOrder`, payload,
    );
  }
}
