import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, timeout } from 'rxjs';
import { HealthEntry } from '../core/models/api.models';
import { apiUrl } from './api';
import { environment } from '../../environments/environment';
@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);
  check() {
    return this.http.get<{ services: HealthEntry[] }>(apiUrl('/health')).pipe(
      timeout(15000),
      map((response) => {
        if (!Array.isArray(response.services)) throw new Error('Respuesta de health no válida');
        return environment.healthServices.map((service) => {
          const status = response.services.find((item) => item.name === service.key)?.status;
          return {
            name: service.label,
            status: status === 'UP' || status === 'DOWN' ? status : 'UNKNOWN',
          } as HealthEntry;
        });
      }),
    );
  }
}
