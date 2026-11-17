import { DestroyRef, inject, signal } from '@angular/core';
import { Observable, Subscription, timeout } from 'rxjs';
import { describeError } from '../core/interceptors/api-error.interceptor';
/** Estado de lectura cancelable y destruido junto a su vista. */
export class Resource<T> {
  readonly data;
  readonly loading = signal(false);
  readonly error = signal('');
  private request?: Subscription;
  constructor(initial: T) {
    this.data = signal<T>(initial);
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }
  load(source: Observable<T>): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.request = source.pipe(timeout(25000)).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(describeError(error));
        this.loading.set(false);
      },
    });
  }
}
