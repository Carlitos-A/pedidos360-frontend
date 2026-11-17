import { Component, input } from '@angular/core';
@Component({
  selector: 'app-kpi-card',
  template: `<section class="card">
    <div class="kpi-label">{{ label() }}</div>
    <div class="kpi-value">{{ value() }}</div>
    <div class="kpi-note">{{ note() }}</div>
  </section>`,
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly note = input('');
}
