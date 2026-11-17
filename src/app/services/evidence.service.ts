import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, map, of, timeout } from 'rxjs';
import { apiUrl } from './api';
export type ValidationCase = 'valid' | 'missing' | 'tampered' | 'expired';
export interface ValidationResult {
  kind: ValidationCase;
  expected: number;
  received: number | null;
  header: string;
  message: string;
  matches: boolean;
}
/** Cambia un bit significativo de la firma base64url (no solo sus bits de relleno). */
export function tamperSignature(token: string): string {
  const parts = token.split('.');
  if (parts.length !== 3 || !/^[A-Za-z0-9_-]+$/.test(parts[2])) throw new Error('JWT no válido');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const signature = parts[2];
  const index = alphabet.indexOf(signature.at(-1)!);
  parts[2] = signature.slice(0, -1) + alphabet[index ^ 32];
  return parts.join('.');
}
@Injectable({ providedIn: 'root' })
export class EvidenceService {
  // HttpBackend evita tanto MsalInterceptor como la recuperación automática del 401.
  private readonly raw = new HttpClient(inject(HttpBackend));
  run(kind: ValidationCase, token = '') {
    const expected = kind === 'valid' ? 200 : 401;
    const headers =
      kind === 'missing'
        ? new HttpHeaders()
        : new HttpHeaders({ Authorization: 'Bearer ' + token });
    const header =
      kind === 'missing' ? '(ninguno)' : 'Bearer ' + token.slice(0, 10) + '…' + token.slice(-4);
    return this.raw
      .get(apiUrl('/orders'), { headers, observe: 'response', responseType: 'text' })
      .pipe(
        timeout(15000),
        map(
          (response) =>
            ({
              kind,
              expected,
              received: response.status,
              header,
              message: 'HTTP ' + response.status,
              matches: response.status === expected,
            }) as ValidationResult,
        ),
        catchError((error: unknown) => {
          const status =
            error instanceof HttpErrorResponse && error.status > 0 ? error.status : null;
          return of({
            kind,
            expected,
            received: status,
            header,
            message: status ? 'HTTP ' + status : 'Sin respuesta HTTP (red, CORS o tiempo agotado)',
            matches: status === expected,
          } as ValidationResult);
        }),
      );
  }
}
