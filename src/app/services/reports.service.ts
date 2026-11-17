import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Kpis, LeadTimePoint, SalesPoint, TopProduct } from '../core/models/api.models';
import { apiUrl, queryParams } from './api';
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  kpis(days = 30) {
    return this.http.get<Kpis>(apiUrl('/reports/kpis'), { params: queryParams({ days }) });
  }
  sales(days = 365) {
    return this.http.get<SalesPoint[]>(apiUrl('/reports/sales'), { params: queryParams({ days }) });
  }
  leadTime(days = 30) {
    return this.http.get<LeadTimePoint[]>(apiUrl('/reports/lead-time'), {
      params: queryParams({ days }),
    });
  }
  topProducts(days = 30) {
    return this.http.get<TopProduct[]>(apiUrl('/reports/top-products'), {
      params: queryParams({ days }),
    });
  }
}
