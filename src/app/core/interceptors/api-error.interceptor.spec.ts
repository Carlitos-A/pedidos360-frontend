import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ApiErrorInterceptor } from './api-error.interceptor';
import { AuthService } from '../../services/auth.service';
import { AccessNotice } from '../auth/guards';
import { apiUrl } from '../../services/api';
describe('Recuperación HTTP limitada a un reintento', () => {
  let http: HttpClient; let backend: HttpTestingController;
  const refresh = vi.fn(); const login = vi.fn();
  beforeEach(() => {
    refresh.mockReset().mockReturnValue(of('fresh-token')); login.mockReset();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting(), { provide: HTTP_INTERCEPTORS, useClass: ApiErrorInterceptor, multi: true }, { provide: AuthService, useValue: { getAccessToken: refresh, login } }] });
    http = TestBed.inject(HttpClient); backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => backend.verify());
  it('renueva silenciosamente tras 401 y repite con el token renovado', () => {
    http.get(apiUrl('/orders')).subscribe();
    backend.expectOne(apiUrl('/orders')).flush('', { status: 401, statusText: 'Unauthorized' });
    const retry = backend.expectOne(apiUrl('/orders'));
    expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh-token'); expect(refresh).toHaveBeenCalledWith(true);
    retry.flush([]); expect(login).not.toHaveBeenCalled();
  });
  it('no entra en bucle si el reintento vuelve a devolver 401', () => {
    http.get(apiUrl('/orders')).subscribe({ error: () => {} });
    backend.expectOne(apiUrl('/orders')).flush('', { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(apiUrl('/orders')).flush('', { status: 401, statusText: 'Unauthorized' });
    expect(refresh).toHaveBeenCalledTimes(1); expect(login).toHaveBeenCalledTimes(1);
  });
  it('inicia login si falla la renovación', () => {
    refresh.mockReturnValue(throwError(() => new Error('expired')));
    http.get(apiUrl('/orders')).subscribe({ error: () => {} });
    backend.expectOne(apiUrl('/orders')).flush('', { status: 401, statusText: 'Unauthorized' });
    expect(login).toHaveBeenCalledTimes(1);
  });
  it('muestra Sin permisos ante 403', () => {
    http.get(apiUrl('/orders')).subscribe({ error: () => {} });
    backend.expectOne(apiUrl('/orders')).flush('', { status: 403, statusText: 'Forbidden' });
    expect(TestBed.inject(AccessNotice).message()).toBe('Sin permisos'); expect(refresh).not.toHaveBeenCalled();
  });
  it('no maneja tokens de otro origen', () => {
    http.get('https://example.test/api/orders').subscribe({ error: () => {} });
    backend.expectOne('https://example.test/api/orders').flush('', { status: 401, statusText: 'Unauthorized' });
    expect(refresh).not.toHaveBeenCalled();
  });
});
