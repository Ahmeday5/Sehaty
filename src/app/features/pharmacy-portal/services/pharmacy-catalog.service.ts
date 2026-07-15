import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AddCatalogItemResponse,
  BrowseMasterItemsParams,
  BrowseMasterItemsResponse,
  PharmacyCatalogParams,
  PharmacyCatalogResponse,
} from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class PharmacyCatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/+$/, '');

  browseMasterItems(params: BrowseMasterItemsParams): Observable<BrowseMasterItemsResponse> {
    let p = new HttpParams()
      .set('page', String(params.page))
      .set('pageSize', String(params.pageSize));
    if (params.search?.trim()) p = p.set('search', params.search.trim());
    if (params.groupId !== undefined) p = p.set('groupId', String(params.groupId));

    return this.http.get<BrowseMasterItemsResponse>(
      `${this.base}/api/PharmacyDashboard/catalog/browseMasterItems`, { params: p },
    );
  }

  getCatalog(params: PharmacyCatalogParams): Observable<PharmacyCatalogResponse> {
    let p = new HttpParams()
      .set('page', String(params.page))
      .set('pageSize', String(params.pageSize));
    if (params.search?.trim()) p = p.set('search', params.search.trim());
    if (params.isAvailable !== undefined) p = p.set('isAvailable', String(params.isAvailable));

    return this.http.get<PharmacyCatalogResponse>(
      `${this.base}/api/PharmacyDashboard/catalog`, { params: p },
    );
  }

  addItem(itemId: number): Observable<AddCatalogItemResponse> {
    return this.http.post<AddCatalogItemResponse>(
      `${this.base}/api/PharmacyDashboard/catalog`, { itemId },
    );
  }

  toggleAvailability(pharmacyItemId: number): Observable<unknown> {
    return this.http.put(
      `${this.base}/api/PharmacyDashboard/catalog/${pharmacyItemId}/toggle`, null,
    );
  }

  deleteItem(pharmacyItemId: number): Observable<unknown> {
    return this.http.delete(
      `${this.base}/api/PharmacyDashboard/catalog/${pharmacyItemId}`,
    );
  }
}
