import { Component, computed, input } from '@angular/core';
import { SalesPoint } from '../../core/models/api.models';
import { LineChartComponent } from '../../shared/line-chart.component';
@Component({
  selector: 'app-sales-chart',
  imports: [LineChartComponent],
  template: `<app-line-chart [points]="points()" label="Ventas por mes en pesos chilenos" />`,
})
export class SalesChartComponent {
  readonly data = input<SalesPoint[]>([]);
  readonly points = computed(() =>
    this.data().map((item) => ({ label: item.month, value: item.sales })),
  );
}
