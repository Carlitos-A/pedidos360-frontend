import { Component, input, output } from '@angular/core';
import { Product } from '../../core/models/api.models';
import { ClpPipe } from '../../shared/format';
@Component({
  selector: 'app-product-card',
  imports: [ClpPipe],
  template: ` <article class="product-row">
    <div>
      <h3>{{ product().name }}</h3>
      <p class="muted">{{ product().category || 'Sin categoría' }}</p>
    </div>
    <div class="product-price">{{ product().price | clp }}</div>
    <div>
      <p [class.stock-low]="product().stock !== null && product().stock! < 10">
        Stock: {{ product().stock ?? 'No disponible' }}
        @if (product().stock !== null && product().stock! < 10) {
          · Bajo
        }
      </p>
      @if (product().stock !== null) {
        <div class="bar-track" style="margin-top:.5rem">
          <div
            class="bar-fill"
            [class.low]="product().stock! < 10"
            [style.width.%]="stockPercent()"
          ></div>
        </div>
      }
    </div>
    @if (canEdit()) {
      <div class="actions">
        <button class="secondary compact" [disabled]="busy()" (click)="edit.emit(product())">
          Editar
        </button>
        <button
          class="secondary compact"
          [attr.aria-label]="'Restar una unidad a ' + product().name"
          [disabled]="busy() || product().stock === null || product().stock! <= 0"
          (click)="stock.emit(-1)"
        >
          − Stock
        </button>
        <button
          class="secondary compact"
          [attr.aria-label]="'Sumar una unidad a ' + product().name"
          [disabled]="busy() || product().stock === null"
          (click)="stock.emit(1)"
        >
          + Stock
        </button>
      </div>
    }
  </article>`,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly busy = input(false);
  readonly canEdit = input(false);
  readonly edit = output<Product>();
  readonly stock = output<number>();
  stockPercent(): number {
    return Math.max(0, Math.min(100, ((this.product().stock ?? 0) / 50) * 100));
  }
}
