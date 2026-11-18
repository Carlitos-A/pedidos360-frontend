import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { Order, OrderFilters, OrderInput, OrderStatus, Page } from '../core/models/api.models';
import { adaptOrder, normalizeStatus, ownsOrder } from '../core/models/adapters';
import { AuthService } from './auth.service';
import { apiUrl, queryParams } from './api';

export class OwnershipError extends Error {
  override name = 'OwnershipError';
}
export function orderPage(
  raw: unknown[] | Page<unknown>,
  filters: OrderFilters,
  canRead: (order: Order) => boolean,
): Page<Order> {
  const page = filters.page ?? 0,
    pageSize = filters.pageSize ?? 10;
  const data = Array.isArray(raw) ? raw : raw.items;
  if (!Array.isArray(data)) throw new Error('Respuesta de pedidos no válida');
  const all = data.map(adaptOrder);
  // Nunca inferir propiedad a partir del nombre/correo libre del pedido.
  if (all.some((order) => !canRead(order)))
    throw new OwnershipError('No se pudo verificar el propietario de los pedidos.');
  if (!Array.isArray(raw)) return { ...raw, items: all };
  const q = (filters.q ?? '').toLocaleLowerCase();
  const filtered = all
    .filter(
      (order) =>
        (!q ||
          (order.id + ' ' + order.customerName + ' ' + order.detail)
            .toLocaleLowerCase()
            .includes(q)) &&
        (!filters.status || order.status === normalizeStatus(filters.status)) &&
        (!filters.from || order.createdAt.slice(0, 10) >= filters.from) &&
        (!filters.to || order.createdAt.slice(0, 10) <= filters.to),
    )
    .sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) ||
        b.id.localeCompare(a.id, undefined, { numeric: true }),
    );
  return {
    items: filtered.slice(page * pageSize, (page + 1) * pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  list(filters: OrderFilters = {}) {
    return this.http
      .get<unknown[] | Page<unknown>>(apiUrl('/orders'), {
        params: queryParams({ page: 0, pageSize: 10, ...filters }),
      })
      .pipe(map((raw) => orderPage(raw, filters, (order) => this.canRead(order))));
  }
  get(id: string) {
    return this.http.get<unknown>(apiUrl('/orders/' + encodeURIComponent(id))).pipe(
      map((raw) => {
        const order = adaptOrder(raw);
        if (!this.canRead(order))
          throw new OwnershipError('No se pudo verificar el propietario del pedido.');
        return order;
      }),
    );
  }
  create(input: OrderInput) {
    return this.http.post<unknown>(apiUrl('/orders'), input).pipe(map(adaptOrder));
  }
  update(id: string, input: OrderInput) {
    return this.http
      .put<unknown>(apiUrl('/orders/' + encodeURIComponent(id)), input)
      .pipe(map(adaptOrder));
  }
  changeStatus(id: string, status: OrderStatus) {
    return this.http
      .patch<unknown>(apiUrl('/orders/' + encodeURIComponent(id) + '/status'), { status })
      .pipe(map(adaptOrder));
  }
  reassign(id: string, customerId: string, customerTenantId: string) {
    return this.http.patch<unknown>(apiUrl('/orders/' + encodeURIComponent(id) + '/owner'),
      { customerId, customerTenantId }).pipe(map(adaptOrder));
  }
  private canRead(order: Order): boolean {
    return (
      this.auth.hasRole('Admin') ||
      (this.auth.hasRole('Cliente') && ownsOrder(order, this.auth.user()))
    );
  }
}
