import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../services/productos.service';
import { AuthService } from '../services/auth.service';
import { Producto } from '../models/producto';

@Component({
  selector: 'app-productos',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly auth = inject(AuthService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly error = signal<string>('');
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly esAdmin = signal(false);

  protected nuevoProducto: Producto = this.productoVacio();

  ngOnInit(): void {
    this.cargarProductos();
    // POST /productos es solo para Admin: el formulario se muestra según el rol del token
    this.auth.esAdmin().subscribe((esAdmin) => this.esAdmin.set(esAdmin));
  }

  cargarProductos(): void {
    this.cargando.set(true);
    this.productos.set([]);
    this.error.set('');

    // El MsalInterceptor adjunta automáticamente el JWT en esta llamada
    this.productosService.listar().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(this.describirError(err));
        this.cargando.set(false);
      },
    });
  }

  crearProducto(): void {
    this.guardando.set(true);
    this.error.set('');

    this.productosService.crear({ ...this.nuevoProducto }).subscribe({
      next: () => {
        this.nuevoProducto = this.productoVacio();
        this.guardando.set(false);
        this.cargarProductos();
      },
      error: (err) => {
        this.error.set(this.describirError(err));
        this.guardando.set(false);
      },
    });
  }

  private productoVacio(): Producto {
    return { nombre: '', categoria: '', precio: 0 };
  }

  private describirError(err: { status?: number; statusText?: string }): string {
    if (err.status === 401) {
      return 'Error 401: no hay token válido, vuelve a iniciar sesión.';
    }
    if (err.status === 403) {
      return 'Error 403: tu rol no tiene permiso para esta operación (crear es solo para Admin).';
    }
    return `Error ${err.status ?? ''}: ${err.statusText || 'No se pudo conectar con el API'}`;
  }
}
