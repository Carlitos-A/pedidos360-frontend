import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AccessNotice } from './core/auth/guards';
@Component({ selector: 'app-root', imports: [RouterOutlet, RouterLink], templateUrl: './app.html' })
export class App {
  readonly notice = inject(AccessNotice);
}
