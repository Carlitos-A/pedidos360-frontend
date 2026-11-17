import { TestBed } from '@angular/core/testing';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
const jwt = (roles: string[]) => 'header.' + btoa(JSON.stringify({ roles, scp: 'pedidos.read', exp: Math.floor(Date.now()/1000) + 3600, oid: 'object', tid: 'tenant' })).replaceAll('=', '') + '.signature';
describe('AuthService conserva roles del access token', () => {
  let acquire: ReturnType<typeof vi.fn>; let handle: ReturnType<typeof vi.fn>; let auth: AuthService;
  beforeEach(() => {
    const account = { name: 'María', username: 'maria@example.test', localAccountId: 'object', tenantId: 'tenant', idTokenClaims: { roles: ['Admin'] } };
    acquire = vi.fn().mockReturnValue(of({ accessToken: jwt(['Cliente']), account, scopes: ['pedidos.read'] }));
    handle = vi.fn().mockReturnValue(of(null));
    TestBed.configureTestingModule({ providers: [
      { provide: MsalService, useValue: { handleRedirectObservable: handle, acquireTokenSilent: acquire, instance: { getActiveAccount: () => account, getAllAccounts: () => [account], setActiveAccount: vi.fn() } } },
      { provide: MsalBroadcastService, useValue: { msalSubject$: new Subject() } },
    ] }); auth = TestBed.inject(AuthService);
  });
  it('procesa una sola vez el redirect y no toma Admin del ID token', async () => {
    await Promise.all([auth.ensureSession(), auth.ensureSession()]);
    expect(handle).toHaveBeenCalledTimes(1); expect(acquire).toHaveBeenCalledTimes(1);
    expect(auth.roles()).toEqual(['Cliente']); expect(auth.displayRole()).toBe('Customer'); expect(auth.hasRole('Admin')).toBe(false);
    expect(auth.scopes()).toEqual(['pedidos.read']);
  });
  it('da prioridad Admin cuando el access token tiene ambos roles', async () => {
    acquire.mockReturnValue(of({ accessToken: jwt(['Cliente', 'Admin']), scopes: [] }));
    await auth.ensureSession(); expect(auth.displayRole()).toBe('Admin');
  });
});
