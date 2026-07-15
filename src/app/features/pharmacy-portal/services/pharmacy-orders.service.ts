import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Order, OrdersListParams, OrdersListResponse, UpdateOrderStatusPayload } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class PharmacyOrdersService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/+$/, '');

  getOrders(params: OrdersListParams): Observable<OrdersListResponse> {
    let p = new HttpParams()
      .set('page', String(params.page))
      .set('pageSize', String(params.pageSize));
    if (params.status !== undefined) p = p.set('status', String(params.status));

    return this.http.get<OrdersListResponse>(`${this.base}/api/PharmacyDashboard/orders`, { params: p });
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.base}/api/PharmacyDashboard/orders/${id}`);
  }

  updateStatus(id: number, payload: UpdateOrderStatusPayload): Observable<unknown> {
    return this.http.put(`${this.base}/api/PharmacyDashboard/orders/${id}/status`, payload);
  }

  markPaid(id: number): Observable<unknown> {
    return this.http.put(`${this.base}/api/PharmacyDashboard/orders/${id}/markPaid`, null);
  }
}
