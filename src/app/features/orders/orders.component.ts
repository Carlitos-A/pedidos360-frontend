import { Component } from '@angular/core';
import { OrderListComponent } from './order-list.component';
@Component({
  selector: 'app-orders',
  imports: [OrderListComponent],
  template: '<app-order-list />',
})
export class OrdersComponent {}
