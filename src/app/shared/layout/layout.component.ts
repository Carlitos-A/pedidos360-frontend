import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <a href="#main-content" class="skip-link">Saltar al contenido</a>
    <header class="app-header">
      <div class="header-top">
        <a class="brand" routerLink="/dashboard">Pedidos360</a>
        <div class="account">
          <div>
            <strong>{{ auth.user().name }}</strong
            ><span class="role-chip">{{ auth.displayRole() }}</span>
          </div>
          <button class="secondary" (click)="auth.logout()">Cerrar sesión</button>
        </div>
      </div>
      <nav aria-label="Menú principal">
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        @if (auth.hasRole('Admin', 'Cliente')) {
          <a routerLink="/orders" routerLinkActive="active">Pedidos</a>
        }
        @if (auth.hasRole('Admin')) {
          <a routerLink="/catalog" routerLinkActive="active">Catálogo</a
          ><a routerLink="/reports" routerLinkActive="active">Reportes</a>
          <a routerLink="/audit" routerLinkActive="active">Auditoría</a
          ><a routerLink="/evidence" routerLinkActive="active">Evidencias</a>
        }
        <a routerLink="/profile" routerLinkActive="active">Mi perfil</a>
      </nav>
    </header>
    <main id="main-content" class="content">
      @if (auth.error()) {
        <p role="alert" class="error">{{ auth.error() }}</p>
      }
      <router-outlet />
    </main>
    <footer class="app-footer">Pedidos360 · Gestión de pedidos</footer>
  `,
})
export class LayoutComponent {
  readonly auth = inject(AuthService);
}
