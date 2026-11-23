import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrdersService } from '../../services/orders.service';
import { OrderWorkService } from '../../services/order-work.service';
import { Order, OrderInput, OrderStatus, OrderTicket } from '../../core/models/api.models';
import { allowedTransitions } from '../../core/models/adapters';
import { describeError } from '../../core/interceptors/api-error.interceptor';
import { LoadStateComponent } from '../../shared/load-state.component';
import { OrderStatusBadgeComponent } from '../../shared/order-status-badge.component';
import { ClpPipe, LocalDatePipe } from '../../shared/format';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomersService, CustomerOption } from '../../services/customers.service';
import { ProductsService } from '../../services/products.service';
import { Product, OrderItem } from '../../core/models/api.models';

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
  private readonly orderWork = inject(OrderWorkService);
  private readonly customers = inject(CustomersService);
  private readonly products = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly order = signal<Order | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly ticket = signal<OrderTicket | null>(null);
  readonly ticketLoading = signal(false);
  readonly ticketError = signal('');
  readonly customerOptions = signal<CustomerOption[]>([]);
  readonly customerError = signal('');
  readonly customerLoading = signal(false);
  readonly catalog = signal<Product[]>([]);
  readonly catalogError = signal('');
  readonly availableProducts = computed(() => this.catalog().filter((product) =>
    product.customerId === this.form.customerId &&
    product.customerTenantId === this.form.customerTenantId &&
    product.price !== null && Number.isSafeInteger(product.price) &&
    product.stock !== null));
  customerQuery = '';
  selectedCustomerId = '';
  readonly transitions = computed(() =>
    this.order() ? allowedTransitions(this.order()!.status) : [],
  );
  readonly isNew = signal(false);
  readonly isTerminal = computed(() => this.order()?.status === 'COMPLETED' || this.order()?.status === 'CANCELLED');
  status: OrderStatus | '' = '';
  form: Omit<OrderInput, 'total'> & { total: number | null } = this.empty();
  private id = '';
  private request?: Subscription;
  private ticketRequest?: Subscription;
  private catalogRequest?: Subscription;
  private createRequestId = crypto.randomUUID();
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.request?.unsubscribe();
      this.ticketRequest?.unsubscribe();
      this.catalogRequest?.unsubscribe();
      this.loading.set(false);
      this.id = params.get('id') ?? '';
      this.isNew.set(!this.id);
      this.order.set(null);
      this.error.set('');
      this.success.set('');
      this.ticket.set(null);
      this.ticketLoading.set(false);
      this.ticketError.set('');
      this.loadError.set('');
      this.form = this.empty();
      this.customerOptions.set([]);
      this.selectedCustomerId = '';
      this.catalog.set([]);
      this.createRequestId = crypto.randomUUID();
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
      this.form.items = [];
      this.catalog.set([]);
      this.recalculate();
      this.loadCatalog();
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
  loadTicket(): void {
    if (!this.id || this.ticketLoading()) return;
    this.ticketRequest?.unsubscribe();
    this.ticketLoading.set(true);
    this.ticketError.set('');
    this.ticket.set(null);
    this.ticketRequest = this.orderWork.ticket(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (ticket) => { this.ticket.set(ticket); this.ticketLoading.set(false); },
      error: (error) => {
        this.ticketLoading.set(false);
        this.ticketError.set(error instanceof HttpErrorResponse && error.status === 404
          ? 'El comprobante aún no está disponible. Puedes volver a consultarlo.'
          : describeError(error));
      },
    });
  }
  downloadTicket(): void {
    const receipt = this.ticket();
    if (!receipt) return;
    const money = (value: number) => new Intl.NumberFormat('es-CL', {
      style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
    }).format(value);
    const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();
    const lines = [
      'PEDIDOS360 · COMPROBANTE INTERNO',
      `Número: ${receipt.ticketNumber}`,
      `Pedido: #${receipt.orderId}`,
      `Cliente: ${oneLine(receipt.customerName)}`,
      `Creado: ${receipt.createdAt}`,
      `Emitido: ${receipt.issuedAt}`,
      '',
      ...receipt.items.map((item) =>
        `${oneLine(item.name)} · ${item.quantity} × ${money(item.unitPrice)} = ${money(item.quantity * item.unitPrice)}`),
      '',
      `TOTAL: ${money(receipt.total)}`,
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${receipt.ticketNumber}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  addItem(): void {
    if (this.isTerminal()) return;
    this.form.items ??= [];
    this.form.items.push({ productId: '', name: '', quantity: 1, unitPrice: 0 });
  }
  selectProduct(item: OrderItem, id: string): void {
    const product = this.availableProducts().find((value) => value.id === id);
    item.productId = product?.id ?? '';
    item.name = product?.name ?? '';
    item.unitPrice = product?.price ?? 0;
    this.recalculate();
  }
  onQuantityChanged(item: OrderItem): void {
    const product = this.availableProducts().find((value) => value.id === item.productId);
    if (product?.price !== null && product?.price !== undefined) {
      item.name = product.name;
      item.unitPrice = product.price;
    }
    this.recalculate();
  }
  loadCatalog(): void {
    if (!this.auth.hasRole('Admin')) return;
    this.catalogRequest?.unsubscribe();
    this.catalogError.set('');
    this.catalogRequest = this.products.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (products) => this.catalog.set(products),
      error: (error) => this.catalogError.set(describeError(error)),
    });
  }
  removeItem(index: number): void {
    if (this.isTerminal()) return;
    this.form.items?.splice(index, 1);
    this.recalculate();
  }
  recalculate(): void {
    if (this.form.items?.length)
      this.form.total = this.form.items.reduce(
        (total, item) => total + Number(item.quantity) * Number(item.unitPrice),
        0,
      );
    else if (this.isNew()) this.form.total = 0;
  }
  private itemsChanged(): boolean {
    const original = this.order()?.items ?? [];
    const current = this.form.items ?? [];
    return current.length !== original.length || current.some((item, index) =>
      item.productId !== original[index].productId || Number(item.quantity) !== original[index].quantity);
  }
  save(): void {
    if (!this.auth.hasRole('Admin') || this.saving()) return;
    this.recalculate();
    const changingItems = this.isNew() || this.itemsChanged();
    if (
      !this.form.customerName.trim() ||
      !this.form.detail.trim() ||
      !this.form.customerId.trim() ||
      !this.form.customerTenantId.trim() ||
      (this.isNew() && !this.form.items?.length) ||
      (!this.isNew() && !!this.order()?.items.length && !this.form.items?.length) ||
      (!this.isNew() && this.order()?.version === null) ||
      (this.isTerminal() && changingItems) ||
      (changingItems && (this.form.total === null || !Number.isSafeInteger(this.form.total) || this.form.total < 0)) ||
      (changingItems && new Set(this.form.items?.map((item) => item.productId)).size !== (this.form.items?.length ?? 0)) ||
      (changingItems && this.form.items?.some(
        (item) =>
          !this.availableProducts().some((product) => product.id === item.productId &&
            product.stock! + (this.order()?.items.find((old) => old.productId === item.productId)?.quantity ?? 0) >= item.quantity) ||
          !item.name.trim() ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          !Number.isSafeInteger(item.unitPrice) ||
          item.unitPrice < 0,
      ))
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
      total: this.form.total ?? 0,
      customerName: this.form.customerName.trim(),
      customerId: this.form.customerId.trim(),
      detail: this.form.detail.trim(),
      requestId: this.isNew() ? this.createRequestId : undefined,
      expectedVersion: this.isNew() ? undefined : this.order()?.version ?? undefined,
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
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.error.set('El precio, stock o pedido cambió. Revisa los datos actualizados antes de guardar.');
          if (this.isNew()) this.createRequestId = crypto.randomUUID();
          else this.load();
          this.loadCatalog();
        } else this.error.set(describeError(error));
      },
    });
  }
  changeStatus(): void {
    if (
      !this.auth.hasRole('Admin') ||
      !this.status ||
      !this.transitions().includes(this.status) ||
      this.order()?.version === null ||
      this.saving()
    )
      return;
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    this.service
      .changeStatus(this.id, this.status, this.order()!.version!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.setOrder(order);
          this.saving.set(false);
          this.success.set('Estado actualizado.');
        },
        error: (error) => {
          this.saving.set(false);
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.error.set('El pedido cambió. Se cargó la versión más reciente; revisa el estado antes de intentar de nuevo.');
            this.load();
          } else this.error.set(describeError(error));
        },
      });
  }
  private setOrder(order: Order): void {
    this.order.set(order);
    this.catalog.set([]);
    this.form = {
      customerName: order.customerName,
      customerId: order.customerId,
      customerTenantId: order.customerTenantId || environment.msalConfig.tenantId,
      detail: order.detail,
      total: order.total,
      items: order.items.map((item) => ({ ...item })),
    };
    this.status = allowedTransitions(order.status)[0] ?? '';
    this.loadCatalog();
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
