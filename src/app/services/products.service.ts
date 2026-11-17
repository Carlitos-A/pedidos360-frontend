import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { ProductInput } from '../core/models/api.models';
import { adaptProduct } from '../core/models/adapters';
import { apiUrl } from './api';
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  list() {
    return this.http
      .get<unknown[]>(apiUrl('/products'))
      .pipe(map((items) => items.map(adaptProduct)));
  }
  create(product: ProductInput) {
    return this.http.post<unknown>(apiUrl('/products'), product).pipe(map(adaptProduct));
  }
  update(id: string, product: ProductInput) {
    return this.http
      .put<unknown>(apiUrl('/products/' + encodeURIComponent(id)), product)
      .pipe(map(adaptProduct));
  }
  adjustStock(id: string, delta: number) {
    return this.http
      .patch<unknown>(apiUrl('/products/' + encodeURIComponent(id) + '/stock'), { delta })
      .pipe(map(adaptProduct));
  }
}
