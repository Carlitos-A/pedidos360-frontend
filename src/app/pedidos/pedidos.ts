import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidosService } from '../services/pedidos.service';
import { AuthService } from '../services/auth.service';
import { Pedido } from '../models/pedido';

@Component({
  selector: 'app-pedidos',
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {
  private readonly pedidosService = inject(PedidosService);
  private readonly auth = inject(AuthService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly error = signal<string>('');
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly esAdmin = signal(false);
  protected readonly pedidoCreado = signal<Pedido | null>(null);

  protected readonly estados = ['PENDIENTE', 'EN_PREPARACION', 'ENTREGADO'];
  protected nuevoPedido: Pedido = this.pedidoVacio();

  ngOnInit(): void {
    this.cargarPedidos();
    // POST /pedidos es solo para Admin: el formulario se muestra según el rol del token
    this.auth.esAdmin().subscribe((esAdmin) => this.esAdmin.set(esAdmin));
  }

  cargarPedidos(): void {
    this.cargando.set(true);
    this.pedidos.set([]);
    this.error.set('');

    // El MsalInterceptor adjunta automáticamente el JWT en esta llamada
    this.pedidosService.listar().subscribe({
      next: (data) => {
        this.pedidos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(this.describirError(err));
        this.cargando.set(false);
      },
    });
  }

  crearPedido(): void {
    this.guardando.set(true);
    this.error.set('');
    this.pedidoCreado.set(null);

    // El LocalDateTime del backend espera ISO sin zona: "yyyy-MM-ddTHH:mm:ss" (hora local)
    const ahora = new Date();
    const fecha = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 19);

    this.pedidosService.crear({ ...this.nuevoPedido, fecha }).subscribe({
      next: (pedido) => {
        this.pedidoCreado.set(pedido);
        this.nuevoPedido = this.pedidoVacio();
        this.guardando.set(false);
        this.cargarPedidos();
      },
      error: (err) => {
        this.error.set(this.describirError(err));
        this.guardando.set(false);
      },
    });
  }

  private pedidoVacio(): Pedido {
    return { cliente: '', detalle: '', total: 0, estado: 'PENDIENTE' };
  }

  private describirError(err: { status?: number; statusText?: string }): string {
    if (err.status === 401) {
      return 'Error 401: no hay token válido, vuelve a iniciar sesión.';
    }
    if (err.status === 403) {
      return 'Error 403: tu rol no tiene permiso para esta operación (crear es solo para Admin).';
    }
    if (err.status === 503) {
      return 'Error 503: el API no está disponible. Revisa la integración del API Gateway en AWS.';
    }
    return `Error ${err.status ?? ''}: ${err.statusText || 'No se pudo conectar con el API'}`;
  }
}
