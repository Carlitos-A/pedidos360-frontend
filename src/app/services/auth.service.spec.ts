import { TestBed } from '@angular/core/testing';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
const jwt = (roles: string[]) =>
  'header.' +
  btoa(
    JSON.stringify({
      roles,
      scp: 'pedidos.read',
      exp: Math.floor(Date.now() / 1000) + 3600,
      oid: 'object',
      tid: 'tenant',
    }),
  ).replaceAll('=', '') +
  '.signature';
describe('AuthService conserva roles del access token', () => {
  let acquire: ReturnType<typeof vi.fn>;
  let handle: ReturnType<typeof vi.fn>;
  let clearCache: ReturnType<typeof vi.fn>;
  let logoutRedirect: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let auth: AuthService;
  beforeEach(() => {
    const account = {
      name: 'María',
      username: 'maria@example.test',
      localAccountId: 'object',
      tenantId: 'tenant',
      idTokenClaims: { roles: ['Admin'] },
    };
    acquire = vi
      .fn()
      .mockReturnValue(of({ accessToken: jwt(['Cliente']), account, scopes: ['pedidos.read'] }));
    handle = vi.fn().mockReturnValue(of(null));
    clearCache = vi.fn().mockResolvedValue(undefined);
    logoutRedirect = vi.fn();
    navigateByUrl = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: MsalService,
          useValue: {
            handleRedirectObservable: handle,
            acquireTokenSilent: acquire,
            logoutRedirect,
            instance: {
              clearCache,
              getActiveAccount: () => account,
              getAllAccounts: () => [account],
              setActiveAccount: vi.fn(),
            },
          },
        },
        { provide: MsalBroadcastService, useValue: { msalSubject$: new Subject() } },
      ],
    });
    auth = TestBed.inject(AuthService);
  });
  it('procesa una sola vez el redirect y no toma Admin del ID token', async () => {
    await Promise.all([auth.ensureSession(), auth.ensureSession()]);
    expect(handle).toHaveBeenCalledTimes(1);
    expect(acquire).toHaveBeenCalledTimes(1);
    expect(acquire.mock.calls[0][0].scopes).toEqual([environment.apiConfig.scopes[0]]);
    expect(auth.roles()).toEqual(['Cliente']);
    expect(auth.displayRole()).toBe('Customer');
    expect(auth.hasRole('Admin')).toBe(false);
    expect(auth.scopes()).toEqual(['pedidos.read']);
  });
  it('da prioridad Admin cuando el access token tiene ambos roles', async () => {
    acquire.mockReturnValue(of({ accessToken: jwt(['Cliente', 'Admin']), scopes: [] }));
    await auth.ensureSession();
    expect(auth.displayRole()).toBe('Admin');
  });
  it('cierra solo la sesión local y vuelve a Login', async () => {
    await auth.ensureSession();
    await auth.logout();
    expect(clearCache).toHaveBeenCalledOnce();
    expect(logoutRedirect).not.toHaveBeenCalled();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.claims()).toEqual({});
    expect(navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });
});
