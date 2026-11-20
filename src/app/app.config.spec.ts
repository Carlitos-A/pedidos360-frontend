import { describe, expect, it } from 'vitest';
import { MSALGuardConfigFactory, MSALInterceptorConfigFactory } from './app.config';
import { environment } from '../environments/environment';

describe('Scopes de la API', () => {
  it('solicita lectura al iniciar sesión y escritura solo para métodos mutables', () => {
    const [read, write] = environment.apiConfig.scopes;
    const authRequest = MSALGuardConfigFactory().authRequest;
    expect(authRequest && typeof authRequest !== 'function' ? authRequest.scopes : null).toEqual([read]);
    const rules = MSALInterceptorConfigFactory().protectedResourceMap
      .get(`${environment.apiBaseUrl}/api/*`);
    expect(rules).toContainEqual({ httpMethod: 'GET', scopes: [read] });
    for (const httpMethod of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      expect(rules).toContainEqual({ httpMethod, scopes: [write] });
    }
  });
});
