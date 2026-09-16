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
        this.refreshLoginDisplay();
      },
      error: (error) => console.error('Error en el redirect de login:', error),
    });

    // Actualiza la barra cuando cambia el estado de autenticación
    this.msalBroadcast.inProgress$
      .pipe(filter((status) => status === InteractionStatus.None))
      .subscribe(() => this.refreshLoginDisplay());
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
