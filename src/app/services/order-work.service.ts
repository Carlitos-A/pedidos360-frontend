import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { OrderNotification, OrderTicket, Page } from '../core/models/api.models';
import { apiUrl, queryParams } from './api';

@Injectable({ providedIn: 'root' })
export class OrderWorkService {
  private readonly http = inject(HttpClient);

  notifications() {
    return this.http.get<Page<OrderNotification>>(apiUrl('/notifications'), {
      params: queryParams({ page: 0, pageSize: 5 }),
    });
  }

  ticket(orderId: string) {
    return this.http.get<OrderTicket>(apiUrl('/orders/' + encodeURIComponent(orderId) + '/ticket'));
  }
}
