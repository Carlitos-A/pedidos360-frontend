import { Injectable, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppRole } from './jwt';
import { CustomersService } from '../../services/customers.service';
@Injectable({ providedIn: 'root' })
export class AccessNotice {
  readonly message = signal('');
}
const customerRegistrationError = 'No se pudo registrar tu cuenta en Pedidos360. Reintenta al entrar en otra sección.';
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const customers = inject(CustomersService);
  const router = inject(Router);
  try {
    await auth.ensureSession();
    if (auth.isAuthenticated()) {
      try {
        await customers.ensureRegistered();
        if (auth.error() === customerRegistrationError) auth.error.set('');
      } catch {
        auth.error.set(customerRegistrationError);
      }
      return true;
    }
  } catch {
    auth.error.set('No se pudo validar tu sesión. Vuelve a iniciar sesión.');
  }
  return router.createUrlTree(['/login']);
};
export const roleGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const notice = inject(AccessNotice);
  try {
    await auth.ensureSession();
  } catch {
    return false;
  }
  if (auth.hasRole(...((route.data['roles'] as AppRole[]) ?? []))) {
    notice.message.set('');
    return true;
  }
  notice.message.set('No tienes permisos para ver esa sección');
  // Cancela sin redirigir; el aviso global también cubre la navegación directa.
  return false;
};
