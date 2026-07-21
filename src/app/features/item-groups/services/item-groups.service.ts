import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ItemGroupLevel,
  ItemGroupPayload,
  ItemGroupsListParams,
  ItemGroupsListResponse,
  UpdateItemGroupPayload,
} from '../models/item-group.model';

@Injectable({ providedIn: 'root' })
export class ItemGroupsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/+$/, '');

  getItemGroups(params: ItemGroupsListParams): Observable<ItemGroupsListResponse> {
    let p = new HttpParams()
      .set('page',     String(params.page))
      .set('pageSize', String(params.pageSize));
    if (params.parentId !== undefined && params.parentId !== null) {
      p = p.set('parentId', String(params.parentId));
    }
    if (params.level !== undefined) p = p.set('level', String(params.level));

    return this.http.get<ItemGroupsListResponse>(`${this.base}/api/Dashboard/getItemGroups`, { params: p });
  }

  /** Top-level main sections — used to seed the tree root. */
  getMainSections(): Observable<ItemGroupsListResponse> {
    return this.getItemGroups({ level: ItemGroupLevel.MainSection, page: 1, pageSize: 10000 });
  }

  add(payload: ItemGroupPayload): Observable<{ message: string; id?: number }> {
    return this.http.post<{ message: string; id?: number }>(
      `${this.base}/api/Dashboard/addItemGroup`, payload,
    );
  }

  update(id: number, payload: UpdateItemGroupPayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.base}/api/Dashboard/updateItemGroup/${id}`, payload,
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.base}/api/Dashboard/deleteItemGroup/${id}`,
    );
  }
}
