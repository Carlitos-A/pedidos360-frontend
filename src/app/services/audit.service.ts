import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuditEvent, AuditFilters, Page } from '../core/models/api.models';
import { apiUrl, queryParams } from './api';
@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  list(filters: AuditFilters) {
    return this.http.get<Page<AuditEvent>>(apiUrl('/audit/events'), {
      params: queryParams(filters),
    });
  }
}
