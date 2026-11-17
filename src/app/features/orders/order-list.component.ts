import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrdersService } from '../../services/orders.service';
import { Order, ORDER_STATUSES, OrderFilters, Page } from '../../core/models/api.models';
import { Resource } from '../../shared/resource';
import { LoadStateComponent } from '../../shared/load-state.component';
import { OrderStatusBadgeComponent } from '../../shared/order-status-badge.component';
import { ClpPipe, LocalDatePipe } from '../../shared/format';

@Component({
  selector: 'app-order-list',
  imports: [
    FormsModule,
    RouterLink,
    LoadStateComponent,
    OrderStatusBadgeComponent,
    ClpPipe,
    LocalDatePipe,
  ],
  template: `
    <div class="page-heading">
      <div>
        <p class="eyebrow">GESTIÓN DE PEDIDOS</p>
        <h1>Pedidos</h1>
        <p class="muted">
          {{
            auth.hasRole('Admin')
              ? 'Consulta, organiza y da seguimiento a todos los pedidos.'
              : 'Consulta los pedidos asociados a tu cuenta.'
          }}
        </p>
      </div>
      @if (auth.hasRole('Admin')) {
        <a class="button" routerLink="/orders/new">+ Nuevo pedido</a>
      }
    </div>
    <section class="card">
      <div class="section-heading">
        <div>
          <h2>{{ auth.hasRole('Admin') ? 'Todos los pedidos' : 'Mis pedidos' }}</h2>
          <p>Encuentra lo que buscas usando los filtros.</p>
        </div>
        <span class="role-chip">Vista: {{ auth.displayRole() }}</span>
      </div>
      <form class="filters" (ngSubmit)="filter()">
        <label
          >Buscar<input
            name="q"
            [(ngModel)]="filters.q"
            placeholder="Cliente, detalle o ID de pedido…"
        /></label>
        <label
          >Estado<select name="status" [(ngModel)]="filters.status">
            <option value="">Todos</option>
            @for (status of statuses; track status) {
              <option [value]="status">{{ status }}</option>
            }
          </select></label
        >
        <label>Desde<input type="date" name="from" [(ngModel)]="filters.from" /></label>
        <label
          >Hasta<input type="date" name="to" [(ngModel)]="filters.to" [min]="filters.from || ''"
        /></label>
        <button type="submit" class="secondary">Filtrar</button>
      </form>
      @if (filterError) {
        <p class="error" role="alert">{{ filterError }}</p>
      }
      <app-load-state
        [loading]="list.loading()"
        [error]="list.error()"
        [empty]="!list.data().items.length"
        emptyText="No se encontraron pedidos con estos filtros."
        (retry)="load()"
      >
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Detalle</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th><span class="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              @for (order of list.data().items; track order.id) {
                <tr>
                  <td class="mono">#{{ order.id }}</td>
                  <td>{{ order.customerName }}</td>
                  <td class="cell-detail">{{ order.detail }}</td>
                  <td class="nowrap">{{ order.total | clp }}</td>
                  <td><app-order-status-badge [status]="order.status" /></td>
                  <td class="nowrap">{{ order.createdAt | localDate }}</td>
                  <td>
                    <div class="actions nowrap">
                      <a class="button secondary compact" [routerLink]="['/orders', order.id]"
                        >Ver</a
                      >
                      @if (
                        auth.hasRole('Admin') &&
                        order.status !== 'COMPLETED' &&
                        order.status !== 'CANCELLED' &&
                        order.status !== 'UNKNOWN'
                      ) {
                        <a
                          class="button secondary compact"
                          [routerLink]="['/orders', order.id]"
                          fragment="change-status"
                          >Cambiar estado</a
                        >
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-load-state>
      @if (!list.loading() && !list.error()) {
        <div class="pagination">
          <span>Mostrando {{ list.data().items.length }} de {{ list.data().total }} pedidos</span>
          <div class="actions">
            <button class="secondary compact" [disabled]="page === 0" (click)="goPage(page - 1)">
              Anterior
            </button>
            <span>Página {{ page + 1 }} de {{ pages() }}</span
            ><button
              class="secondary compact"
              [disabled]="page + 1 >= pages()"
              (click)="goPage(page + 1)"
            >
              Siguiente
            </button>
          </div>
        </div>
      }
    </section>
  `,
})
export class OrderListComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly service = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);
  readonly list = new Resource<Page<Order>>({ items: [], total: 0, page: 0, pageSize: 10 });
  readonly statuses = ORDER_STATUSES;
  filters: OrderFilters = { q: '', status: '', from: '', to: '' };
  applied: OrderFilters = {};
  page = 0;
  filterError = '';
  ngOnInit(): void {
    this.filters.status = this.route.snapshot.queryParamMap.get('status') ?? '';
    this.filter();
  }
  filter(): void {
    if (this.filters.from && this.filters.to && this.filters.from > this.filters.to) {
      this.filterError = 'La fecha inicial debe ser anterior a la final.';
      return;
    }
    this.filterError = '';
    this.page = 0;
    this.applied = { ...this.filters };
    this.load();
  }
  load(): void {
    this.list.load(this.service.list({ ...this.applied, page: this.page, pageSize: 10 }));
  }
  goPage(page: number): void {
    this.page = page;
    this.load();
  }
  pages(): number {
    return Math.max(1, Math.ceil(this.list.data().total / 10));
  }
}
