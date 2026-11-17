import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-profile',
  template: ` <div class="page-heading">
      <div>
        <p class="eyebrow">MI CUENTA</p>
        <h1>Mi perfil</h1>
        <p class="muted">Tu identidad y permisos de acceso.</p>
      </div>
    </div>
    <section class="card profile-card">
      <h2>Información de la cuenta</h2>
      <dl class="detail-list">
        <dt>Nombre</dt>
        <dd>{{ auth.user().name || 'Sin nombre' }}</dd>
        <dt>Correo</dt>
        <dd>{{ auth.user().email || 'Sin correo' }}</dd>
        <dt>Rol en la interfaz</dt>
        <dd>
          <span class="role-chip">{{ auth.displayRole() }}</span>
        </dd>
        <dt>Roles del access token</dt>
        <dd>{{ auth.roles().join(', ') || 'Sin roles asignados en Entra ID' }}</dd>
        <dt>Scopes</dt>
        <dd>{{ auth.scopes().join(', ') || 'Sin scopes' }}</dd>
      </dl>
      <p class="muted small">
        Cliente se muestra como Customer. Los roles y scopes se leen del access token que recibe el
        API.
      </p>
    </section>`,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
}
