import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Advertisement, AdvertisementsPage } from '../models/advertisement.model';
import { environment } from '../../../../environments/environment';

const PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class AdvertisementsService {
  private readonly http = inject(HttpClient);
  private readonly api  = inject(ApiService);
  private readonly base = environment.apiUrl.replace(/\/+$/, '');

  getPage(page = 1, pageSize = PAGE_SIZE): Observable<AdvertisementsPage> {
    const params = new HttpParams()
      .set('page',     String(page))
      .set('pageSize', String(pageSize));

    return this.http
      .get<AdvertisementsPage>(`${this.base}/api/Dashboard/getAllAdvertisements`, { params })
      .pipe(
        map((res) => ({
          total:    res?.total    ?? 0,
          page:     res?.page     ?? page,
          pageSize: res?.pageSize ?? pageSize,
          data:     res?.data     ?? [],
        })),
      );
  }

  add(formData: FormData): Observable<string> {
    return this.api.postText('api/Dashboard/addAdvertisement', formData);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.base}/api/Dashboard/deleteAdvertisement/${id}`,
    );
  }
}
