import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CacheService } from '../../../core/services/cache.service';
import { Speciality } from '../../specialities/models/speciality.model';
import { Doctor, DoctorIdNameSpec } from '../models/doctor.model';

const CACHE_KEY    = 'doctors:all';
const CACHE_TTL_MS = 10 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class DoctorsService {
  private readonly api   = inject(ApiService);
  private readonly cache = inject(CacheService);

  getAllSpecialities(): Observable<Speciality[]> {
    return this.api.get<Speciality[]>('api/Dashboard/getAllSpecialities').pipe(
      map((res) => (Array.isArray(res) ? res : (res as any)?.data ?? [])),
    );
  }

  getAllDoctors(): Observable<Doctor[]> {
    const cached = this.cache.get<Doctor[]>(CACHE_KEY);
    if (cached) return of(cached);

    return this.api.get<Doctor[]>('api/Dashboard/getAllDoctors').pipe(
      map((res) => {
        const list: Doctor[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
        this.cache.set(CACHE_KEY, list, CACHE_TTL_MS);
        return list;
      }),
    );
  }

  getDoctorsBySpecialization(specialization: string): Observable<Doctor[]> {
    return this.api
      .get<Doctor[]>('api/Dashboard/getDoctorsBySpecialization', { params: { specialization } })
      .pipe(map((res) => (Array.isArray(res) ? res : (res as any)?.data ?? [])));
  }

  searchByName(name: string): Observable<Doctor[]> {
    return this.api
      .get<Doctor[]>('api/Dashboard/searchByDoctorName', { params: { name } })
      .pipe(map((res) => (Array.isArray(res) ? res : [])));
  }

  getDoctorById(id: number): Observable<Doctor> {
    return this.api.get<Doctor>(`api/Dashboard/getDoctor/${id}`);
  }

  addDoctor(formData: FormData): Observable<string> {
    return this.api.postText('api/Dashboard/addDoctor', formData).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  updateDoctor(id: number, formData: FormData): Observable<string> {
    return this.api.putText(`api/Dashboard/updateDoctor/${id}`, formData).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  deleteDoctor(id: number): Observable<string> {
    return this.api.deleteText(`api/Dashboard/deleteDoctor/${id}`).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  activateDoctor(id: number): Observable<string> {
    return this.api.putText(`api/Dashboard/activateDoctor/${id}`, null).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  deactivateDoctor(id: number): Observable<string> {
    return this.api.putText(`api/Dashboard/deactivateDoctor/${id}`, null).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  getAllDoctorsNames(): Observable<{ doctorNames: string[] }> {
    return this.api.get<{ doctorNames: string[] }>('api/Dashboard/getAllDoctorsNames');
  }

  getAllDoctorsIdNameSpecialization(): Observable<DoctorIdNameSpec[]> {
    return this.api
      .get<DoctorIdNameSpec[]>('api/Dashboard/getAllDoctorsIDNameAndSpecialization')
      .pipe(map((res) => (Array.isArray(res) ? res : (res as any)?.data ?? [])));
  }

  invalidate(): void { this.cache.invalidate(CACHE_KEY); }
}
