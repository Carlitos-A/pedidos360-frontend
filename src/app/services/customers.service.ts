import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { apiUrl, queryParams } from './api';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

export interface CustomerOption {
  id: string;
  tenantId: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly directHttp = new HttpClient(inject(HttpBackend));
  private readonly auth = inject(AuthService);
  private registeredIdentity = '';
  private registration?: Promise<void>;
  search(q: string) {
    return this.http.get<CustomerOption[]>(apiUrl('/customers'), { params: queryParams({ q }) });
  }
  registerMe(accessToken: string) {
    return this.directHttp.post<CustomerOption>(apiUrl('/customers/me'), null, {
      headers: new HttpHeaders({ Authorization: `Bearer ${accessToken}` }),
    });
  }

  ensureRegistered(): Promise<void> {
    if (!this.auth.hasRole('Cliente') || this.auth.hasRole('Admin')) return Promise.resolve();
    const { id, tenantId } = this.auth.user();
    const identity = `${tenantId}:${id}`;
    if (this.registeredIdentity === identity) return Promise.resolve();
    this.registration ??= firstValueFrom(this.auth.getAccessToken())
      .then((token) => firstValueFrom(this.registerMe(token)))
      .then(() => { this.registeredIdentity = identity; })
      .finally(() => { this.registration = undefined; });
    return this.registration;
  }
}
