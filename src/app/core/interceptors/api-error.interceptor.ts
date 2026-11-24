import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { AccessNotice } from '../auth/guards';
export function describeError(error: unknown): string {
  if (error instanceof Error && error.name === 'OwnershipError')
    return 'El servidor no informó una cuenta propietaria válida para tu pedido. Solicita que se revise la asociación de tu cuenta.';
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0)
      return 'No se pudo conectar con el servidor. Comprueba la conexión e inténtalo nuevamente.';
    if (error.status === 401) return 'Tu sesión no es válida. Vuelve a iniciar sesión.';
    if (error.status === 403) return 'Sin permisos para realizar esta operación.';
    if (error.status === 404) return 'El recurso solicitado no está disponible.';
    if (error.status === 409)
      return 'Los datos cambiaron o el stock es insuficiente. Actualiza antes de reintentar.';
    if (error.status >= 500)
      return 'El servicio no está disponible en este momento. Inténtalo nuevamente.';
    if (error.status === 400 || error.status === 422)
      return 'Revisa los datos ingresados. El servidor no pudo aceptarlos.';
  }
  return 'No se pudieron cargar los datos. Inténtalo nuevamente.';
}
@Injectable()
export class ApiErrorInterceptor implements HttpInterceptor {
  private readonly auth = inject(AuthService);
  private readonly notice = inject(AccessNotice);
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const prefix = environment.apiBaseUrl.replace(/\/$/, '') + '/api/';
    if (!req.url.startsWith(prefix)) return next.handle(req);
    return next.handle(req).pipe(
      catchError((error) => {
        if (error.status === 403) this.notice.message.set('Sin permisos');
        if (error.status !== 401) return throwError(() => error);
        return this.auth.getAccessToken(true).pipe(
          catchError(() => throwError(() => error)),
          switchMap((token) => {
            if (!token) return throwError(() => error);
            return next
              .handle(req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }))
              .pipe(
                catchError((retryError) => {
                  if (retryError.status === 403) this.notice.message.set('Sin permisos');
                  return throwError(() => retryError);
                }),
              );
          }),
        );
      }),
    );
  }
}
