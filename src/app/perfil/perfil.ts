import { Component, OnInit, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-perfil',
  imports: [],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private readonly msal = inject(MsalService);

  protected readonly nombre = signal('');
  protected readonly correo = signal('');
  protected readonly roles = signal<string[]>([]);
  protected readonly scopes = signal<string[]>([]);
  protected readonly accessTokenClaims = signal<Record<string, unknown>>({});
  protected readonly idTokenClaims = signal<Record<string, unknown>>({});

  ngOnInit(): void {
    const account =
      this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0];

    if (!account) {
      return;
    }

    // Claims del ID token (identidad del usuario)
    const idClaims = (account.idTokenClaims ?? {}) as Record<string, unknown>;
    this.nombre.set(account.name ?? '');
    this.correo.set(account.username);
    this.idTokenClaims.set(idClaims);

    // Access token: el que viaja al API. AQUÍ vienen roles y scopes.
    this.msal
      .acquireTokenSilent({ scopes: environment.apiConfig.scopes, account })
      .subscribe({
        next: (result) => {
          const payload = this.decodeJwtPayload(result.accessToken);
          this.accessTokenClaims.set(payload);
          this.roles.set((payload['roles'] as string[]) ?? []);
          this.scopes.set(
            ((payload['scp'] as string) ?? '').split(' ').filter((s) => s.length > 0)
          );
        },
        error: (e) => console.error('No se pudo obtener el access token:', e),
      });
  }

  private decodeJwtPayload(token: string): Record<string, unknown> {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  }
}
