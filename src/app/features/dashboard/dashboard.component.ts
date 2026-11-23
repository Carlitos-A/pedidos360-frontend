import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { OrdersService } from '../../services/orders.service';
import { OrderWorkService } from '../../services/order-work.service';
import { ReportsService } from '../../services/reports.service';
import { Kpis, Order, OrderNotification, ORDER_STATUSES, Page, SalesPoint } from '../../core/models/api.models';
import { nextStatus } from '../../core/models/adapters';
import { describeError } from '../../core/interceptors/api-error.interceptor';
import { Resource } from '../../shared/resource';
import { LoadStateComponent } from '../../shared/load-state.component';
import { KpiCardComponent } from '../../shared/kpi-card.component';
import { OrderStatusBadgeComponent } from '../../shared/order-status-badge.component';
import { OrderStepperComponent } from '../../shared/order-stepper.component';
import { ClpPipe, LocalDatePipe, numberLabel } from '../../shared/format';
import { LineChartComponent } from '../../shared/line-chart.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    LoadStateComponent,
    KpiCardComponent,
    OrderStatusBadgeComponent,
    OrderStepperComponent,
    ClpPipe,
    LocalDatePipe,
    LineChartComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly orders = inject(OrdersService);
  private readonly orderWork = inject(OrderWorkService);
  private readonly reports = inject(ReportsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly kpis = new Resource<Kpis | null>(null);
  readonly sales = new Resource<SalesPoint[]>([]);
  readonly recent = new Resource<Page<Order>>({ items: [], total: 0, page: 0, pageSize: 5 });
  readonly notifications = new Resource<Page<OrderNotification>>({ items: [], total: 0, page: 0, pageSize: 5 });
  readonly operations = new Resource<{
    pending: Page<Order>;
    accepted: Page<Order>;
    progress: Page<Order>;
  } | null>(null);
  readonly actionError = signal('');
  readonly changing = signal('');
  readonly statuses = ORDER_STATUSES;
  readonly number = numberLabel;
  readonly money = (value: number | null | undefined) => new ClpPipe().transform(value);
  readonly next = nextStatus;
  readonly chartPoints = computed(() =>
    this.sales.data().map((point) => ({ label: point.month, value: point.orderCount })),
  );
  readonly inProgress = computed(() => [
    ...(this.operations.data()?.accepted.items ?? []),
    ...(this.operations.data()?.progress.items ?? []),
  ]);
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    if (!this.auth.hasRole('Admin', 'Cliente')) return;
    this.loadRecent();
    if (this.auth.hasRole('Cliente') && !this.auth.hasRole('Admin')) this.loadNotifications();
    if (this.auth.hasRole('Admin')) {
      this.loadKpis();
      this.loadSales();
      this.loadOperations();
    }
  }
  loadRecent(): void {
    this.recent.load(this.orders.list({ pageSize: 5 }));
  }
  loadNotifications(): void {
    this.notifications.load(this.orderWork.notifications());
  }
  loadKpis(): void {
    this.kpis.load(this.reports.kpis());
  }
  loadSales(): void {
    this.sales.load(this.reports.sales(365));
  }
  loadOperations(): void {
    this.operations.load(
      forkJoin({
        pending: this.orders.list({ status: 'CREATED', pageSize: 5 }),
        accepted: this.orders.list({ status: 'ACCEPTED', pageSize: 5 }),
        progress: this.orders.list({ status: 'IN_PROGRESS', pageSize: 5 }),
      }),
    );
  }
  statusWidth(count: number): number {
    const max = Math.max(1, ...Object.values(this.kpis.data()?.byStatus ?? {}).map(Number));
    return (count / max) * 100;
  }
  advance(order: Order): void {
    const status = nextStatus(order.status);
    if (!this.auth.hasRole('Admin') || !status || order.version === null || this.changing()) return;
    this.changing.set(order.id);
    this.actionError.set('');
    this.orders
      .changeStatus(order.id, status, order.version)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.changing.set('');
          this.load();
        },
        error: (error) => {
          this.changing.set('');
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.actionError.set('El pedido cambió. Revisa los datos actualizados antes de intentar de nuevo.');
            this.load();
          } else this.actionError.set(describeError(error));
        },
      });
  }
}
