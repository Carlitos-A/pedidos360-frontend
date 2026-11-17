import { Component, input } from '@angular/core';
import { DisplayStatus } from '../core/models/api.models';
@Component({
  selector: 'app-order-stepper',
  template: `
    @if (status() === 'CANCELLED') {
      <p class="info">Este pedido fue cancelado. No tiene próximas etapas.</p>
    } @else if (status() === 'UNKNOWN') {
      <p class="info">El estado de este pedido aún no tiene equivalencia.</p>
    } @else {
      <ol class="stepper" aria-label="Progreso del pedido">
        @for (step of steps; track step; let i = $index) {
          <li
            [class.done]="i <= index()"
            [class.current]="step === status()"
            [attr.aria-current]="step === status() ? 'step' : null"
          >
            <span class="step-number">{{ i < index() ? '✓' : i + 1 }}</span
            >{{ step }}
          </li>
        }
      </ol>
    }
  `,
})
export class OrderStepperComponent {
  readonly status = input.required<DisplayStatus>();
  readonly steps: DisplayStatus[] = ['CREATED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
  index(): number {
    return this.steps.indexOf(this.status());
  }
}
