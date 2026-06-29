import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CacheService } from '../../../core/services/cache.service';
import { Employee } from '../models/user.model';

const CACHE_KEY = 'users:all';
const TTL       = 10 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api   = inject(ApiService);
  private readonly cache = inject(CacheService);

  getAll(): Observable<Employee[]> {
    const cached = this.cache.get<Employee[]>(CACHE_KEY);
    if (cached) return of(cached);

    return this.api.get<Employee[]>('api/Dashboard/getAllEmployees').pipe(
      map((res) => {
        const list: Employee[] = Array.isArray(res) ? res : (res as any)?.employees ?? [];
        this.cache.set(CACHE_KEY, list, TTL);
        return list;
      }),
    );
  }

  getById(id: string): Observable<Employee> {
    return this.api.get<Employee>(`api/Dashboard/getEmployee/${id}`);
  }

  addUser(formData: FormData): Observable<string> {
    return this.api.postText('api/Dashboard/addEmployee', formData).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  updateUser(id: string, formData: FormData): Observable<string> {
    return this.api.putText(`api/Dashboard/updateEmployee/${id}`, formData).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  deleteUser(id: number): Observable<string> {
    return this.api.deleteText(`api/Dashboard/deleteEmployee/${id}`).pipe(
      map((res) => { this.invalidate(); return res; }),
    );
  }

  invalidate(): void { this.cache.invalidate(CACHE_KEY); }
}
