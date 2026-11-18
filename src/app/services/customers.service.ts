import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl, queryParams } from './api';

export interface CustomerOption {
  id: string;
  tenantId: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  search(q: string) {
    return this.http.get<CustomerOption[]>(apiUrl('/customers'), { params: queryParams({ q }) });
  }
}
