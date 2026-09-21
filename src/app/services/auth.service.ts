import { Injectable, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Wrapper sobre MsalService con helpers de autenticación
 * y lectura de claims (roles) del token.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msal = inject(MsalService);

  login(): void {
    this.msal.loginRedirect();
  }

  logout(): void {
    this.msal.logoutRedirect();
  }

  isLoggedIn(): boolean {
    return this.msal.instance.getAllAccounts().length > 0;
  }

  getNombre(): string {
    const account =
      this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0];
    return account?.name ?? '';
  }

  /**
   * Roles de la app ("Admin" / "Cliente"). Se leen del ACCESS token,
   * que es el que el backend valida (claim "roles" → APPROLE_*).
   */
  getRoles(): Observable<string[]> {
    return this.getAccessTokenClaims().pipe(
      map((claims) => (claims['roles'] as string[]) ?? [])
    );
  }

  esAdmin(): Observable<boolean> {
    return this.getRoles().pipe(map((roles) => roles.includes('Admin')));
  }

  /** Claims del access token que viaja al API (aquí vienen roles y scopes). */
  getAccessTokenClaims(): Observable<Record<string, unknown>> {
    const account =
      this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0];

    if (!account) {
      return of({});
    }

    return this.msal
      .acquireTokenSilent({ scopes: environment.apiConfig.scopes, account })
      .pipe(
        map((result) => this.decodeJwtPayload(result.accessToken)),
        catchError((e) => {
          console.error('No se pudo obtener el access token:', e);
          return of({});
        })
      );
  }

  private decodeJwtPayload(token: string): Record<string, unknown> {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  }
}
