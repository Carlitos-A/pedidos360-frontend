import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../services/products.service';
import { AuthService } from '../../services/auth.service';
import { Product, ProductInput } from '../../core/models/api.models';
import { describeError } from '../../core/interceptors/api-error.interceptor';
import { Resource } from '../../shared/resource';
import { LoadStateComponent } from '../../shared/load-state.component';
import { ProductCardComponent } from './product-card.component';
import { ProductFormComponent } from './product-form.component';
@Component({
  selector: 'app-catalog',
  imports: [FormsModule, LoadStateComponent, ProductCardComponent, ProductFormComponent],
  template: `
    <div class="page-heading">
      <div>
        <p class="eyebrow">PRODUCTOS E INVENTARIO</p>
        <h1>Catálogo</h1>
        <p class="muted">Administra tus productos y mantén el stock al día.</p>
      </div>
    </div>
    @if (success()) {
      <p class="success" role="status">{{ success() }}</p>
    }
    @if (stockError()) {
      <div class="error" role="alert">
        {{ stockError() }}
        <button class="secondary compact" (click)="load()">Actualizar catálogo</button>
      </div>
    }
    <div class="with-panel">
      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Catálogo de productos</h2>
            <p>{{ filtered().length }} productos</p>
          </div>
          <label
            ><span class="visually-hidden">Buscar producto</span
            ><input
              [ngModel]="search()"
              (ngModelChange)="search.set($event)"
              placeholder="Buscar producto o categoría…"
          /></label>
        </div>
        <app-load-state
          [loading]="products.loading()"
          [error]="products.error()"
          [empty]="!filtered().length"
          emptyText="No hay productos que coincidan con la búsqueda."
          (retry)="load()"
        >
          @for (product of filtered(); track product.id) {
            <app-product-card
              [product]="product"
              [canEdit]="auth.hasRole('Admin')"
              [busy]="saving() || !!adjusting()"
              (edit)="edit($event)"
              (stock)="adjust(product, $event)"
            />
          }
        </app-load-state>
      </section>
      @if (auth.hasRole('Admin')) {
        <app-product-form
          [product]="selected()"
          [busy]="saving() || !!adjusting()"
          [error]="formError()"
          [resetKey]="resetKey()"
          (save)="save($event)"
          (cancel)="edit(null)"
        />
      }
    </div>
  `,
})
export class CatalogComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly service = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly products = new Resource<Product[]>([]);
  readonly search = signal('');
  readonly selected = signal<Product | null>(null);
  readonly saving = signal(false);
  readonly adjusting = signal('');
  readonly formError = signal('');
  readonly stockError = signal('');
  readonly success = signal('');
  readonly resetKey = signal(0);
  readonly filtered = computed(() =>
    this.products
      .data()
      .filter((product) =>
        (product.name + ' ' + product.category)
          .toLocaleLowerCase()
          .includes(this.search().toLocaleLowerCase()),
      ),
  );
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.products.load(this.service.list());
  }
  edit(product: Product | null): void {
    this.selected.set(product);
    this.formError.set('');
    this.success.set('');
  }
  save(input: ProductInput): void {
    if (!this.auth.hasRole('Admin') || this.saving() || this.adjusting()) return;
    this.saving.set(true);
    this.formError.set('');
    this.success.set('');
    const selected = this.selected();
    (selected ? this.service.update(selected.id, input) : this.service.create(input))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.selected.set(null);
          this.resetKey.update((key) => key + 1);
          this.success.set('Producto guardado.');
          this.load();
        },
        error: (error) => {
          this.saving.set(false);
          this.formError.set(describeError(error));
        },
      });
  }
  adjust(product: Product, delta: number): void {
    if (
      !this.auth.hasRole('Admin') ||
      this.adjusting() ||
      this.saving() ||
      product.stock === null ||
      product.stock + delta < 0
    )
      return;
    this.adjusting.set(product.id);
    this.stockError.set('');
    this.success.set('');
    this.service
      .adjustStock(product.id, delta)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.products.data.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.adjusting.set('');
          if (this.selected()?.id === updated.id) this.selected.set(updated);
          this.success.set('Stock actualizado.');
        },
        error: (error) => {
          this.adjusting.set('');
          this.stockError.set(describeError(error));
        },
      });
  }
}
