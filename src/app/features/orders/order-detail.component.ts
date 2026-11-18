import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrdersService } from '../../services/orders.service';
import { Order, OrderInput, OrderStatus } from '../../core/models/api.models';
import { allowedTransitions } from '../../core/models/adapters';
import { describeError } from '../../core/interceptors/api-error.interceptor';
import { LoadStateComponent } from '../../shared/load-state.component';
import { OrderStatusBadgeComponent } from '../../shared/order-status-badge.component';
import { ClpPipe, LocalDatePipe } from '../../shared/format';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';
import { CustomersService, CustomerOption } from '../../services/customers.service';

@Component({
  selector: 'app-order-detail',
  imports: [
    FormsModule,
    RouterLink,
    LoadStateComponent,
    OrderStatusBadgeComponent,
    ClpPipe,
    LocalDatePipe,
  ],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly service = inject(OrdersService);
  private readonly customers = inject(CustomersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly order = signal<Order | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly customerOptions = signal<CustomerOption[]>([]);
  readonly customerError = signal('');
  readonly customerLoading = signal(false);
  customerQuery = '';
  selectedCustomerId = '';
  readonly transitions = computed(() =>
    this.order() ? allowedTransitions(this.order()!.status) : [],
  );
  readonly isNew = signal(false);
  status: OrderStatus | '' = '';
  form: Omit<OrderInput, 'total'> & { total: number | null } = this.empty();
  private id = '';
  private request?: Subscription;
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.request?.unsubscribe();
      this.loading.set(false);
      this.id = params.get('id') ?? '';
      this.isNew.set(!this.id);
      this.order.set(null);
      this.error.set('');
      this.success.set('');
      this.loadError.set('');
      this.form = this.empty();
      this.customerOptions.set([]);
      this.selectedCustomerId = '';
      if (this.id) this.load();
    });
  }
  searchCustomers(): void {
    if (this.customerQuery.trim().length < 2) return;
    this.selectedCustomerId = '';
    this.customerOptions.set([]);
    if (this.isNew()) {
      this.form.customerName = '';
      this.form.customerId = '';
    }
    this.customerLoading.set(true);
    this.customerError.set('');
    this.customers.search(this.customerQuery.trim()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (options) => { this.customerOptions.set(options); this.customerLoading.set(false); },
      error: (error) => { this.customerError.set(describeError(error)); this.customerLoading.set(false); },
    });
  }
  chooseCustomer(id: string): void {
    const customer = this.customerOptions().find((option) => option.id === id);
    this.selectedCustomerId = id;
    if (customer && this.isNew()) {
      this.form.customerName = customer.name;
      this.form.customerId = customer.id;
      this.form.customerTenantId = customer.tenantId;
    }
  }
  reassignOwner(): void {
    const customer = this.customerOptions().find((option) => option.id === this.selectedCustomerId);
    if (!customer || this.isNew() || !this.auth.hasRole('Admin') || this.saving()) return;
    this.saving.set(true); this.error.set('');
    this.service.reassign(this.id, customer.id, customer.tenantId)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (order) => { this.setOrder(order); this.saving.set(false); this.success.set('Propietario actualizado.'); },
        error: (error) => { this.saving.set(false); this.error.set(describeError(error)); },
      });
  }
  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.request?.unsubscribe();
    this.request = this.service
      .get(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.setOrder(order);
          this.loading.set(false);
        },
        error: (error) => {
          this.loadError.set(describeError(error));
          this.loading.set(false);
        },
      });
  }
  addItem(): void {
    this.form.items ??= [];
    this.form.items.push({ productId: '', name: '', quantity: 1, unitPrice: 0 });
  }
  removeItem(index: number): void {
    this.form.items?.splice(index, 1);
    this.recalculate();
  }
  recalculate(): void {
    if (this.form.items?.length)
      this.form.total = this.form.items.reduce(
        (total, item) => total + Number(item.quantity) * Number(item.unitPrice),
        0,
      );
  }
  save(): void {
    if (!this.auth.hasRole('Admin') || this.saving()) return;
    this.recalculate();
    if (
      !this.form.customerName.trim() ||
      !this.form.detail.trim() ||
      !this.form.customerId.trim() ||
      !this.form.customerTenantId.trim() ||
      this.form.total === null ||
      !Number.isFinite(this.form.total) ||
      this.form.total < 0 ||
      this.form.items?.some(
        (item) =>
          !item.productId.trim() ||
          !item.name.trim() ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          !Number.isFinite(item.unitPrice) ||
          item.unitPrice < 0,
      )
    ) {
      this.error.set(
        'Completa cliente, cuenta, detalle y valores válidos. Las cantidades deben ser enteros positivos.',
      );
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    const input = {
      ...this.form,
      total: this.form.total,
      customerName: this.form.customerName.trim(),
      customerId: this.form.customerId.trim(),
      detail: this.form.detail.trim(),
    };
    const request = this.isNew() ? this.service.create(input) : this.service.update(this.id, input);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (order) => {
        this.saving.set(false);
        if (this.isNew()) void this.router.navigate(['/orders', order.id]);
        else {
          this.setOrder(order);
          this.success.set('Cambios guardados.');
        }
      },
      error: (error) => {
        this.saving.set(false);
        this.error.set(describeError(error));
      },
    });
  }
  changeStatus(): void {
    if (
      !this.auth.hasRole('Admin') ||
      !this.status ||
      !this.transitions().includes(this.status) ||
      this.saving()
    )
      return;
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    this.service
      .changeStatus(this.id, this.status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.setOrder(order);
          this.saving.set(false);
          this.success.set('Estado actualizado.');
        },
        error: (error) => {
          this.saving.set(false);
          this.error.set(describeError(error));
        },
      });
  }
  private setOrder(order: Order): void {
    this.order.set(order);
    this.form = {
      customerName: order.customerName,
      customerId: order.customerId,
      customerTenantId: order.customerTenantId || environment.msalConfig.tenantId,
      detail: order.detail,
      total: order.total,
      items: order.items.map((item) => ({ ...item })),
    };
    this.status = allowedTransitions(order.status)[0] ?? '';
  }
  private empty(): OrderInput {
    return {
      customerName: '',
      customerId: '',
      customerTenantId: environment.msalConfig.tenantId,
      detail: '',
      total: 0,
      items: [],
    };
  }
}
