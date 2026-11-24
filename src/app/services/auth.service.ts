import { Injectable, computed, inject, signal } from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { AuthenticationResult, EventType } from '@azure/msal-browser';
import { Observable, firstValueFrom, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppRole, decodeJwtPayload, tokenRoles } from '../core/auth/jwt';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msal = inject(MsalService);
  private readonly broadcast = inject(MsalBroadcastService);
  private readonly router = inject(Router);
  private initialization?: Promise<void>;
  private session?: Promise<void>;
  private redirecting = false;
  readonly isAuthenticated = signal(false);
  readonly user = signal({ name: '', email: '', id: '', tenantId: '' });
  readonly claims = signal<Record<string, unknown>>({});
  readonly roles = computed(() => tokenRoles(this.claims()));
  readonly scopes = computed(() =>
    String(this.claims()['scp'] ?? '')
      .split(' ')
      .filter(Boolean),
  );
  readonly displayRole = computed(() =>
    this.hasRole('Admin') ? 'Admin' : this.hasRole('Cliente') ? 'Customer' : 'Sin rol',
  );
  readonly error = signal('');

  constructor() {
    this.broadcast.msalSubject$.subscribe((event) => {
      if (
        event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS ||
        event.eventType === EventType.LOGIN_SUCCESS
      ) {
        const result = event.payload as AuthenticationResult;
        if (
          result?.accessToken &&
          result.scopes.some((scope) => environment.apiConfig.scopes.includes(scope))
        )
          this.acceptToken(result);
      }
      if (event.eventType === EventType.LOGOUT_SUCCESS) this.clearSession();
    });
  }

  /** Una resolución del redirect; el wrapper ejecuta initialize + handleRedirectPromise. */
  initialize(): Promise<void> {
    return (this.initialization ??= firstValueFrom(
      this.msal.handleRedirectObservable({ navigateToLoginRequestUrl: false }),
    )
      .then((result) => {
        const account =
          result?.account ??
          this.msal.instance.getActiveAccount() ??
          this.msal.instance.getAllAccounts()[0];
        if (account) {
          this.msal.instance.setActiveAccount(account);
          this.isAuthenticated.set(true);
          this.user.set({
            name: account.name ?? account.username,
            email: account.username,
            id: account.localAccountId,
            tenantId: account.tenantId,
          });
        }
        if (result?.accessToken) this.acceptToken(result);
      })
      .catch((error) => {
        this.clearSession();
        this.error.set('No se pudo completar el inicio de sesión. Inténtalo nuevamente.');
        throw error;
      }));
  }

  async ensureSession(): Promise<void> {
    await this.initialize();
    if (!this.isAuthenticated()) return;
    if (Number(this.claims()['exp'] ?? 0) * 1000 > Date.now() + 60000) return;
    this.session ??= firstValueFrom(this.getAccessToken())
      .then(() => undefined)
      .finally(() => (this.session = undefined));
    await this.session;
  }

  getAccessToken(forceRefresh = false): Observable<string> {
    const account = this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0];
    if (!account) return of('');
    return this.msal
      .acquireTokenSilent({ scopes: [environment.apiConfig.scopes[0]], account, forceRefresh })
      .pipe(
        tap((result) => this.acceptToken(result)),
        map((result) => result.accessToken),
      );
  }

  async login(): Promise<void> {
    if (this.redirecting) return;
    this.redirecting = true;
    this.error.set('');
    try {
      await this.initialize().catch(() => undefined);
      await firstValueFrom(this.msal.loginRedirect({ scopes: [environment.apiConfig.scopes[0]] }));
    } catch {
      this.error.set('No se pudo abrir Microsoft. Reintenta el inicio de sesión.');
    } finally {
      this.redirecting = false;
    }
  }
  async logout(): Promise<void> {
    try {
      await this.msal.instance.clearCache();
      this.clearSession();
      this.error.set('');
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch {
      this.error.set('No se pudo cerrar sesión. Inténtalo nuevamente.');
    }
  }

  hasRole(...roles: AppRole[]): boolean {
    return roles.some((role) => this.roles().includes(role));
  }
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }
  getNombre(): string {
    return this.user().name;
  }
  getRoles(): Observable<string[]> {
    return this.getAccessTokenClaims().pipe(map(tokenRoles));
  }
  esAdmin(): Observable<boolean> {
    return this.getRoles().pipe(map((roles) => roles.includes('Admin')));
  }
  getAccessTokenClaims(): Observable<Record<string, unknown>> {
    return this.getAccessToken().pipe(map(decodeJwtPayload));
  }

  private acceptToken(result: AuthenticationResult): void {
    this.claims.set(decodeJwtPayload(result.accessToken));
    const account = result.account;
    if (account) {
      this.isAuthenticated.set(true);
      this.user.set({
        name: account.name ?? account.username,
        email: account.username,
        id: String(this.claims()['oid'] ?? account.localAccountId),
        tenantId: String(this.claims()['tid'] ?? account.tenantId),
      });
    }
  }
  private clearSession(): void {
    this.isAuthenticated.set(false);
    this.claims.set({});
    this.user.set({ name: '', email: '', id: '', tenantId: '' });
  }
}
