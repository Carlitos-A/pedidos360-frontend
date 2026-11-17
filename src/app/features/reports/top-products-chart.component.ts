import { Component, computed, input } from '@angular/core';
import { TopProduct } from '../../core/models/api.models';
@Component({
  selector: 'app-top-products-chart',
  template: `
    @if (!data().length) {
      <p class="empty">No hay ventas de productos registradas.</p>
    }
    @for (product of data(); track product.productId) {
      <div class="bar-row">
        <div class="bar-label">
          <strong>{{ product.name }}</strong
          ><span class="muted">{{ product.units }} u.</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" [style.width.%]="(product.units / max()) * 100"></div>
        </div>
      </div>
    }
  `,
})
export class TopProductsChartComponent {
  readonly data = input<TopProduct[]>([]);
  readonly max = computed(() => Math.max(1, ...this.data().map((item) => item.units)));
}
