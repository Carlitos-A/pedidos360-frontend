import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { OrdersService, OwnershipError, orderPage } from './orders.service';
import { AuthService } from './auth.service';
import { apiUrl } from './api';
describe('Contrato de pedidos', () => {
  let http: HttpTestingController; let service: OrdersService; let admin = true;
  beforeEach(() => {
    admin = true;
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { hasRole: (role: string) => role === 'Admin' ? admin : !admin, user: () => ({ id: 'me', tenantId: 'tenant' }) } }] });
    http = TestBed.inject(HttpTestingController); service = TestBed.inject(OrdersService);
  });
  afterEach(() => http.verify());
  it('usa el API Manager con filtros y paginación desde cero', () => {
    service.list({ q: 'Andes', status: 'CREATED', page: 1, pageSize: 10 }).subscribe(result => expect(result.total).toBe(11));
    const req = http.expectOne(request => request.url === apiUrl('/orders'));
    expect(req.request.params.get('status')).toBe('CREATED'); expect(req.request.params.get('q')).toBe('Andes'); expect(req.request.params.get('page')).toBe('1');
    req.flush({ items: [{ id: 11, cliente: 'Andes', estado: 'PENDIENTE' }], total: 11, page: 1, pageSize: 10 });
  });
  it('rechaza pedidos ajenos o sin propietario para Cliente', () => {
    admin = false; let error: unknown;
    service.list().subscribe({ error: e => error = e });
    http.expectOne(request => request.url === apiUrl('/orders')).flush([{ id: 1, cliente: 'me' }]);
    expect(error).toBeInstanceOf(OwnershipError);
  });
  it('rechaza un detalle de otro tenant y acepta el propio', () => {
    admin = false; let error: unknown;
    service.get('1').subscribe({ error: e => error = e });
    http.expectOne(apiUrl('/orders/1')).flush({ id: 1, customerId: 'me', customerTenantId: 'other' });
    expect(error).toBeInstanceOf(OwnershipError);
    service.get('2').subscribe(order => expect(order.id).toBe('2'));
    http.expectOne(apiUrl('/orders/2')).flush({ id: 2, customerId: 'me', customerTenantId: 'tenant', status: 'CREATED' });
  });
  it('filtra y pagina un array legado antes de contarlo', () => {
    const raw = Array.from({ length: 23 }, (_, i) => ({ id: i + 1, cliente: 'Andes', estado: i < 20 ? 'PENDIENTE' : 'ENTREGADO', fecha: '2026-11-01' }));
    const page = orderPage(raw, { status: 'CREATED', page: 1, pageSize: 10 }, () => true);
    expect(page.items).toHaveLength(10); expect(page.total).toBe(20); expect(page.items[0].id).toBe('10');
  });
  it('separa edición de datos del cambio de estado', () => {
    service.changeStatus('7', 'ACCEPTED').subscribe();
    const req = http.expectOne(apiUrl('/orders/7/status'));
    expect(req.request.method).toBe('PATCH'); expect(req.request.body).toEqual({ status: 'ACCEPTED' });
    req.flush({ id: 7, status: 'ACCEPTED' });
  });
});
