import { Component, computed, input } from '@angular/core';
import { LeadTimePoint } from '../../core/models/api.models';
@Component({
  selector: 'app-lead-time-chart',
  template: `
    @if (!data().length) {
      <p class="empty">No hay pedidos completados en este período.</p>
    } @else {
      <svg
        class="chart"
        viewBox="0 0 520 250"
        role="img"
        aria-label="Días promedio hasta completar un pedido"
      >
        <title>Lead time por mes</title>
        @for (y of [25, 75, 125, 175, 215]; track y) {
          <line class="chart-grid" x1="20" x2="500" [attr.y1]="y" [attr.y2]="y" />
        }
        @for (point of data(); track $index; let i = $index) {
          <rect
            class="chart-bars"
            [attr.x]="x(i)"
            [attr.y]="215 - height(point.days)"
            [attr.width]="width()"
            [attr.height]="height(point.days)"
            rx="5"
          >
            <title>{{ point.month }}: {{ point.days }} días</title>
          </rect>
          <text
            [attr.x]="x(i) + width() / 2"
            [attr.y]="205 - height(point.days)"
            text-anchor="middle"
          >
            {{ point.days }}
          </text>
          <text [attr.x]="x(i) + width() / 2" y="240" text-anchor="middle">{{ point.month }}</text>
        }
      </svg>
      <details class="small muted">
        <summary>Ver datos del gráfico</summary>
        <table>
          <thead>
            <tr>
              <th>Período</th>
              <th>Días</th>
            </tr>
          </thead>
          <tbody>
            @for (point of data(); track $index) {
              <tr>
                <td>{{ point.month }}</td>
                <td>{{ point.days }}</td>
              </tr>
            }
          </tbody>
        </table>
      </details>
    }
  `,
})
export class LeadTimeChartComponent {
  readonly data = input<LeadTimePoint[]>([]);
  readonly max = computed(() => Math.max(1, ...this.data().map((item) => item.days)));
  width(): number {
    return Math.min(42, 350 / Math.max(1, this.data().length));
  }
  x(i: number): number {
    return 20 + ((i + 0.5) * 480) / this.data().length - this.width() / 2;
  }
  height(days: number): number {
    return (days / this.max()) * 180;
  }
}
