import { Component, computed, input } from '@angular/core';
export interface ChartPoint {
  label: string;
  value: number;
}
@Component({
  selector: 'app-line-chart',
  template: `
    @if (!points().length) {
      <p class="empty">No hay datos para este período.</p>
    } @else {
      <svg class="chart" viewBox="0 0 600 250" role="img" [attr.aria-label]="label()">
        <title>{{ label() }}</title>
        @for (y of [25, 75, 125, 175, 215]; track y) {
          <line class="chart-grid" x1="35" x2="575" [attr.y1]="y" [attr.y2]="y" />
        }
        <polygon
          class="chart-area"
          [attr.points]="'35,215 ' + coordinates() + ' ' + lastX() + ',215'"
        />
        <polyline class="chart-line" [attr.points]="coordinates()" />
        @for (point of points(); track $index; let i = $index) {
          <circle class="chart-dot" [attr.cx]="x(i)" [attr.cy]="y(point.value)" r="3.5">
            <title>{{ point.label }}: {{ point.value }}</title>
          </circle>
          <text [attr.x]="x(i)" y="240" text-anchor="middle">{{ point.label }}</text>
        }
      </svg>
      <details class="small muted">
        <summary>Ver datos del gráfico</summary>
        <table>
          <thead>
            <tr>
              <th>Período</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            @for (point of points(); track $index) {
              <tr>
                <td>{{ point.label }}</td>
                <td>{{ point.value }}</td>
              </tr>
            }
          </tbody>
        </table>
      </details>
    }
  `,
})
export class LineChartComponent {
  readonly points = input<ChartPoint[]>([]);
  readonly label = input('Evolución mensual');
  readonly max = computed(() => Math.max(1, ...this.points().map((point) => point.value)));
  readonly coordinates = computed(() =>
    this.points()
      .map((point, i) => this.x(i) + ',' + this.y(point.value))
      .join(' '),
  );
  x(i: number): number {
    return this.points().length === 1 ? 305 : 35 + (i * 540) / (this.points().length - 1);
  }
  y(value: number): number {
    return 215 - (value / this.max()) * 180;
  }
  lastX(): number {
    return this.x(this.points().length - 1);
  }
}
