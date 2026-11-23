import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  provideRouter,
} from '@angular/router';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { AccessNotice, authGuard, roleGuard } from './guards';
import { CustomersService } from '../../services/customers.service';
describe('Guards de acceso', () => {
  let authenticated = true;
  let roles = ['Cliente'];
  const ensureRegistered = vi.fn().mockResolvedValue(undefined);
  beforeEach(() => {
    authenticated = true;
    roles = ['Cliente'];
    ensureRegistered.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            ensureSession: vi.fn().mockResolvedValue(undefined),
            isAuthenticated: () => authenticated,
            hasRole: (...allowed: string[]) => allowed.some((role) => roles.includes(role)),
            error: Object.assign(() => '', { set: vi.fn() }),
          },
        },
        { provide: CustomersService, useValue: { ensureRegistered } },
      ],
    });
  });
  it('envía usuarios sin sesión al login', async () => {
    authenticated = false;
    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(TestBed.inject(Router).serializeUrl(result as never)).toBe('/login');
  });
  it('registra al Cliente al abrir una ruta protegida', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(result).toBe(true);
    expect(ensureRegistered).toHaveBeenCalledOnce();
  });
  it('cancela sin redirigir una ruta Admin y muestra el aviso', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      roleGuard(
        { data: { roles: ['Admin'] } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );
    expect(result).toBe(false);
    expect(TestBed.inject(AccessNotice).message()).toBe('No tienes permisos para ver esa sección');
  });
  it('acepta Admin y limpia un aviso anterior', async () => {
    roles = ['Admin'];
    TestBed.inject(AccessNotice).message.set('anterior');
    expect(
      await TestBed.runInInjectionContext(() =>
        roleGuard(
          { data: { roles: ['Admin'] } } as unknown as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
        ),
      ),
    ).toBe(true);
    expect(TestBed.inject(AccessNotice).message()).toBe('');
  });
  it('no da permisos por el nombre Customer u Operator', async () => {
    roles = ['Customer', 'Operator'];
    expect(
      await TestBed.runInInjectionContext(() =>
        roleGuard(
          { data: { roles: ['Admin', 'Cliente'] } } as unknown as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
        ),
      ),
    ).toBe(false);
  });
});
