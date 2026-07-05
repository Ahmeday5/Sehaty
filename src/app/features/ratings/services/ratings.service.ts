import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DoctorRatingsListParams,
  DoctorRatingsListResponse,
  RatingsDistributionResponse,
  TopAndWorstRatedDoctorsResponse,
} from '../models/ratings.model';

@Injectable({ providedIn: 'root' })
export class RatingsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/+$/, '');

  getDoctorRatings(params: DoctorRatingsListParams): Observable<DoctorRatingsListResponse> {
    let p = new HttpParams()
      .set('page',     String(params.page))
      .set('pageSize', String(params.pageSize));
    if (params.stars)             p = p.set('stars',      String(params.stars));
    if (params.doctorName?.trim()) p = p.set('doctorName', params.doctorName.trim());

    return this.http.get<DoctorRatingsListResponse>(
      `${this.base}/api/Dashboard/getDoctorRatings`, { params: p }
    );
  }

  getRatingsDistribution(): Observable<RatingsDistributionResponse> {
    return this.http.get<RatingsDistributionResponse>(
      `${this.base}/api/Dashboard/getRatingsDistribution`
    );
  }

  getTopAndWorstRatedDoctors(topCount: number, bottomCount: number): Observable<TopAndWorstRatedDoctorsResponse> {
    const p = new HttpParams()
      .set('topCount',    String(topCount))
      .set('bottomCount', String(bottomCount));

    return this.http.get<TopAndWorstRatedDoctorsResponse>(
      `${this.base}/api/Dashboard/getTopAndWorstRatedDoctors`, { params: p }
    );
  }
}
