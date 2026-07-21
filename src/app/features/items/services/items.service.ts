import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import { ItemsListParams, ItemsListResponse } from '../models/item.model';

@Injectable({ providedIn: 'root' })
export class ItemsService {
  private readonly api  = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/+$/, '');

  getItems(params: ItemsListParams): Observable<ItemsListResponse> {
    let p = new HttpParams()
      .set('page',     String(params.page))
      .set('pageSize', String(params.pageSize));
    if (params.itemGroupId !== undefined) p = p.set('itemGroupId', String(params.itemGroupId));
    if (params.code?.trim())              p = p.set('code',        params.code.trim());
    if (params.barcode?.trim())           p = p.set('barcode',     params.barcode.trim());

    return this.http.get<ItemsListResponse>(`${this.base}/api/Dashboard/getItems`, { params: p });
  }

  addItem(formData: FormData): Observable<string> {
    return this.api.postText('api/Dashboard/addItem', formData);
  }

  updateItem(id: number, formData: FormData): Observable<string> {
    return this.api.putText(`api/Dashboard/updateItem/${id}`, formData);
  }

  deleteItem(id: number): Observable<string> {
    return this.api.deleteText(`api/Dashboard/deleteItem/${id}`);
  }
}
