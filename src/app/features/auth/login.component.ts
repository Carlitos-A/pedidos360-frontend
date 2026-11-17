import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-login',
  template: ` <main class="auth-page">
    <section class="card auth-card">
      <p class="brand">Pedidos360</p>
      <h1>Bienvenido</h1>
      <p class="muted">
        Gestiona tus pedidos en un solo lugar.<br />Accede con tu cuenta de Microsoft.
      </p>
      @if (auth.error()) {
        <p class="error" role="alert">{{ auth.error() }}</p>
      }
      <button class="microsoft-button" [disabled]="busy()" (click)="login()">
        {{ busy() ? 'Conectando…' : 'Iniciar sesión con Microsoft' }}
      </button>
      <p class="institution">Usa tu cuenta institucional (&#64;duocuc.cl)</p>
      <p class="small muted">Acceso seguro con Microsoft Entra ID</p>
    </section>
  </main>`,
})
export class LoginComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  async ngOnInit(): Promise<void> {
    try {
      await this.auth.ensureSession();
      if (this.auth.isAuthenticated() && !this.auth.error())
        await this.router.navigateByUrl('/dashboard');
    } catch {
      this.auth.error.set('Tu sesión necesita validarse nuevamente. Inicia sesión para continuar.');
    }
  }
  async login(): Promise<void> {
    this.busy.set(true);
    await this.auth.login();
    this.busy.set(false);
  }
}
