import { Component, input, output } from '@angular/core';
@Component({
  selector: 'app-load-state',
  template: `
    @if (loading()) {
      <div class="loading" role="status" aria-live="polite">Cargando…</div>
    } @else if (error()) {
      <div class="error" role="alert">
        {{ error() }} <button class="secondary compact" (click)="retry.emit()">Reintentar</button>
      </div>
    } @else if (empty()) {
      <div class="empty">{{ emptyText() }}</div>
    } @else {
      <ng-content />
    }
  `,
})
export class LoadStateComponent {
  readonly loading = input(false);
  readonly error = input('');
  readonly empty = input(false);
  readonly emptyText = input('No hay datos para mostrar.');
  readonly retry = output<void>();
}
