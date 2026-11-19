import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { EvidenceService, ValidationResult, tamperSignature } from './evidence.service';
import { apiUrl } from './api';
describe('Pruebas JWT sin intervención de MSAL', () => {
  let http: HttpTestingController;
  let service: EvidenceService;
  const interceptor = vi.fn();
  beforeEach(() => {
    interceptor.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([
            (req, next) => {
              interceptor();
              return next(req.clone({ setHeaders: { Authorization: 'Bearer injected' } }));
            },
          ]),
        ),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(EvidenceService);
  });
  afterEach(() => http.verify());
  it.each(['missing', 'tampered', 'expired', 'valid'] as const)(
    'mantiene el header de %s y no ejecuta interceptores',
    (kind) => {
      let result: ValidationResult | undefined;
      service.run(kind, 'provided-token').subscribe((value) => (result = value));
      const req = http.expectOne(apiUrl('/orders'));
      expect(req.request.headers.get('Authorization')).toBe(
        kind === 'missing' ? null : 'Bearer provided-token',
      );
      if (kind === 'valid') req.flush('[]');
      else req.flush('', { status: 401, statusText: 'Unauthorized' });
      expect(result?.matches).toBe(true);
      expect(interceptor).not.toHaveBeenCalled();
    },
  );
  it('no confunde errores de CORS con 401', () => {
    service.run('missing').subscribe((result) => {
      expect(result.received).toBeNull();
      expect(result.matches).toBe(false);
    });
    http.expectOne(apiUrl('/orders')).error(new ProgressEvent('error'));
  });
  it('altera bytes reales de la firma incluso con bits de relleno base64url', () => {
    const token = 'header.payload.AA';
    const tampered = tamperSignature(token);
    expect(tampered.split('.').slice(0, 2)).toEqual(token.split('.').slice(0, 2));
    expect(atob(tampered.split('.')[2] + '==')).not.toBe(atob('AA=='));
  });
});
