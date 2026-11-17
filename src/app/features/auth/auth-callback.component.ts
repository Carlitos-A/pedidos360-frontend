import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-auth-callback',
  template: ` <main class="auth-page">
    <section class="card auth-card" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <h1 class="h2">Completando inicio de sesión…</h1>
      <p class="muted">Validando la respuesta de Microsoft Entra ID y obteniendo tu sesión.</p>
    </section>
  </main>`,
})
export class AuthCallbackComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  async ngOnInit(): Promise<void> {
    try {
      await this.auth.ensureSession();
      if (!this.auth.isAuthenticated()) throw new Error('No account');
      await this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch {
      this.auth.error.set('No se pudo completar el inicio de sesión. Inténtalo nuevamente.');
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }
}
