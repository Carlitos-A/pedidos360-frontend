import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JsonPipe } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-pedidos',
  imports: [JsonPipe],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos {
  private readonly http = inject(HttpClient);

  protected readonly pedidos = signal<unknown>(null);
  protected readonly error = signal<string>('');
  protected readonly cargando = signal(false);

  cargarPedidos(): void {
    this.cargando.set(true);
    this.pedidos.set(null);
    this.error.set('');

    // MsalInterceptor adjunta automáticamente el JWT en esta llamada
    this.http.get(`${environment.apiConfig.uri}/pedidos`).subscribe({
      next: (data) => {
        this.pedidos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(
          `Error ${err.status ?? ''}: ${err.statusText || 'No se pudo conectar con el API'}`
        );
        this.cargando.set(false);
      },
    });
  }
}
