import { Component, input } from '@angular/core';
import { DisplayStatus } from '../core/models/api.models';
@Component({
  selector: 'app-order-status-badge',
  template: `<span [class]="'badge ' + status().toLowerCase()">{{
    status() === 'UNKNOWN' ? 'SIN EQUIVALENCIA' : status()
  }}</span>`,
})
export class OrderStatusBadgeComponent {
  readonly status = input.required<DisplayStatus>();
}
