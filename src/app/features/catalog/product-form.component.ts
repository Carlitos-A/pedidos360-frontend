import { Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product, ProductInput } from '../../core/models/api.models';
@Component({
  selector: 'app-product-form',
  imports: [FormsModule],
  template: ` <section class="card">
    <div class="section-heading">
      <div>
        <h2>{{ product() ? 'Editar producto' : 'Nuevo producto' }}</h2>
        <p>
          {{
            product() ? 'Actualiza sus datos y disponibilidad.' : 'Agrega un producto al catálogo.'
          }}
        </p>
      </div>
    </div>
    <form #productForm="ngForm" class="form-stack" (ngSubmit)="submit()">
      <label
        >Nombre<input
          name="name"
          [(ngModel)]="form.name"
          required
          maxlength="200"
          placeholder="Ej.: Teclado mecánico"
      /></label>
      <label
        >Categoría<input
          name="category"
          [(ngModel)]="form.category"
          required
          maxlength="100"
          placeholder="Ej.: Periféricos"
      /></label>
      <div class="form-grid">
        <label
          >Precio (CLP)<input
            name="price"
            type="number"
            min="0"
            step="1"
            [(ngModel)]="form.price"
            required
        /></label>
        <label
          >Stock<input
            name="stock"
            type="number"
            min="0"
            step="1"
            [(ngModel)]="form.stock"
            required
        /></label>
      </div>
      @if (validation) {
        <p class="error" role="alert">{{ validation }}</p>
      }
      @if (error()) {
        <p class="error" role="alert">{{ error() }} Vuelve a guardar para reintentar.</p>
      }
      <button [disabled]="productForm.invalid || busy()">
        {{ busy() ? 'Guardando…' : 'Guardar producto' }}
      </button>
      @if (product()) {
        <button type="button" class="secondary" [disabled]="busy()" (click)="cancel.emit()">
          Cancelar edición
        </button>
      }
    </form>
  </section>`,
})
export class ProductFormComponent {
  readonly product = input<Product | null>(null);
  readonly busy = input(false);
  readonly error = input('');
  readonly resetKey = input(0);
  readonly save = output<ProductInput>();
  readonly cancel = output<void>();
  form: Omit<ProductInput, 'price' | 'stock'> & { price: number | null; stock: number | null } = {
    name: '',
    category: '',
    price: null,
    stock: null,
  };
  validation = '';
  constructor() {
    effect(() => {
      this.resetKey();
      const product = this.product();
      this.form = {
        name: product?.name ?? '',
        category: product?.category ?? '',
        price: product?.price ?? null,
        stock: product?.stock ?? null,
      };
      this.validation = '';
    });
  }
  submit(): void {
    if (this.busy()) return;
    if (
      !this.form.name.trim() ||
      !this.form.category.trim() ||
      this.form.price === null ||
      this.form.stock === null ||
      !Number.isSafeInteger(this.form.price) ||
      this.form.price < 0 ||
      !Number.isInteger(this.form.stock) ||
      this.form.stock < 0
    ) {
      this.validation = 'Ingresa nombre, categoría, precio válido y stock entero no negativo.';
      return;
    }
    this.validation = '';
    this.save.emit({
      ...this.form,
      name: this.form.name.trim(),
      category: this.form.category.trim(),
      price: this.form.price!,
      stock: this.form.stock!,
    });
  }
}
