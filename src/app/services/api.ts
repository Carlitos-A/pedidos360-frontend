import { HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
export function apiUrl(path: string): string {
  return environment.apiBaseUrl.replace(/\/$/, '') + '/api' + path;
}
export function queryParams(values: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== null && value !== '')
      params = params.set(key, String(value));
  return params;
}
