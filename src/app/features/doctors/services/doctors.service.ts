import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Speciality } from '../../specialities/models/speciality.model';
import {
  Doctor,
  DoctorIdNameSpec,
  DoctorsListParams,
  DoctorsListResponse,
} from '../models/doctor.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DoctorsService {
  private readonly api  = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/+$/, '');

  getAllSpecialities(): Observable<Speciality[]> {
    return this.api.get<Speciality[]>('api/Dashboard/getAllSpecialities').pipe(
      map((res) => (Array.isArray(res) ? res : (res as any)?.data ?? [])),
    );
  }

  // ── New unified server-side endpoint ───────────────────────────────────────
  getDoctors(params: DoctorsListParams): Observable<DoctorsListResponse> {
    let p = new HttpParams()
      .set('page',     String(params.page))
      .set('pageSize', String(params.pageSize));
    if (params.name?.trim())           p = p.set('name',           params.name.trim());
    if (params.specialization?.trim()) p = p.set('specialization', params.specialization.trim());
    if (params.isActive !== undefined) p = p.set('isActive',       String(params.isActive));

    return this.http.get<DoctorsListResponse>(
      `${this.base}/api/Dashboard/getDoctors`, { params: p }
    );
  }

  // ── Legacy helpers kept for details / form pages ───────────────────────────
  getDoctorById(id: number): Observable<Doctor> {
    return this.api.get<Doctor>(`api/Dashboard/getDoctor/${id}`);
  }

  addDoctor(formData: FormData): Observable<string> {
    return this.api.postText('api/Dashboard/addDoctor', formData);
  }

  updateDoctor(id: number, formData: FormData): Observable<string> {
    return this.api.putText(`api/Dashboard/updateDoctor/${id}`, formData);
  }

  deleteDoctor(id: number): Observable<string> {
    return this.api.deleteText(`api/Dashboard/deleteDoctor/${id}`);
  }

  activateDoctor(id: number): Observable<string> {
    return this.api.putText(`api/Dashboard/activateDoctor/${id}`, null);
  }

  deactivateDoctor(id: number): Observable<string> {
    return this.api.putText(`api/Dashboard/deactivateDoctor/${id}`, null);
  }

  getAllDoctorsIdNameSpecialization(): Observable<DoctorIdNameSpec[]> {
    return this.api
      .get<DoctorIdNameSpec[]>('api/Dashboard/getAllDoctorsIDNameAndSpecialization')
      .pipe(map((res) => (Array.isArray(res) ? res : (res as any)?.data ?? [])));
  }
}
