import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { filter } from 'rxjs';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly msal = inject(MsalService);
  private readonly msalBroadcast = inject(MsalBroadcastService);

  protected readonly loginDisplay = signal(false);

  ngOnInit(): void {
    // Procesa el retorno del login de Microsoft Entra ID
    this.msal.handleRedirectObservable().subscribe({
      next: (result) => {
        if (result?.account) {
          this.msal.instance.setActiveAccount(result.account);
        }
        this.cleanUrl();
        this.refreshLoginDisplay();
      },
      error: (error) => {
        console.error('Error en el redirect de login:', error);
        // Autorrecuperación: si el estado guardado no coincide (state_mismatch)
        // o el código expiró, limpiamos el caché de MSAL y la URL,
        // dejando la app lista para un nuevo intento de login.
        this.msal.instance.clearCache();
        this.cleanUrl();
        this.refreshLoginDisplay();
      },
    });

    // Actualiza la barra cuando cambia el estado de autenticación
    this.msalBroadcast.inProgress$
      .pipe(filter((status) => status === InteractionStatus.None))
      .subscribe(() => this.refreshLoginDisplay());
  }

  /**
   * Quita el ?code=...&state=... de la barra de direcciones después
   * de procesar el retorno del login. Evita que una recarga intente
   * procesar el mismo código dos veces (causa del state_mismatch).
   */
  private cleanUrl(): void {
    if (window.location.search || window.location.hash.includes('code=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  login(): void {
    this.msal.loginRedirect();
  }

  logout(): void {
    this.msal.logoutRedirect();
  }

  private refreshLoginDisplay(): void {
    this.loginDisplay.set(this.msal.instance.getAllAccounts().length > 0);
  }
}
