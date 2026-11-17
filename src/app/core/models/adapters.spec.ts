import { describe, expect, it } from 'vitest';
import { adaptOrder, adaptProduct, allowedTransitions, normalizeStatus, ownsOrder } from './adapters';
import { decodeJwtPayload, tokenRoles } from '../auth/jwt';
import { ClpPipe, LocalDatePipe } from '../../shared/format';
describe('Migración y permisos', () => {
  it.each([['PENDIENTE', 'CREATED'], ['EN_PREPARACION', 'IN_PROGRESS'], ['ENTREGADO', 'COMPLETED'], ['ACCEPTED', 'ACCEPTED'], ['CANCELLED', 'CANCELLED'], ['OTRO', 'UNKNOWN']])('adapta %s a %s', (old, current) => expect(normalizeStatus(old)).toBe(current));
  it('conserva los campos antiguos sin inventar stock ni historial', () => {
    const order = adaptOrder({ id: 7, cliente: 'Cliente Demo', detalle: 'Pizza', total: 12990, estado: 'ENTREGADO', fecha: '2026-11-01T12:30:00' });
    expect(order).toMatchObject({ id: '7', customerName: 'Cliente Demo', detail: 'Pizza', total: 12990, status: 'COMPLETED', history: [], customerId: '' });
    expect(adaptProduct({ id: 3, nombre: 'Teclado', categoria: 'Periféricos', precio: 54990 })).toMatchObject({ name: 'Teclado', stock: null, price: 54990 });
  });
  it('preserva cero y no interpreta un estado desconocido como CREATED', () => {
    expect(adaptProduct({ id: '1', stock: 0, price: 0 }).stock).toBe(0);
    expect(adaptOrder({ id: '1', estado: 'DESPACHADO' })).toMatchObject({ status: 'UNKNOWN', rawStatus: 'DESPACHADO', total: null });
  });
  it('exige propietario y tenant coincidentes', () => {
    const order = adaptOrder({ id: 1, cliente: 'Ana', customerId: 'ana', customerTenantId: 'tenant-a' });
    expect(ownsOrder(order, { id: 'ana', tenantId: 'tenant-a' })).toBe(true);
    expect(ownsOrder(order, { id: 'ana', tenantId: 'tenant-b' })).toBe(false);
    expect(ownsOrder(adaptOrder({ id: 1, cliente: 'Ana' }), { id: 'ana', tenantId: 'tenant-a' })).toBe(false);
  });
  it('no permite retroceder ni modificar estados terminales', () => {
    expect(allowedTransitions('CREATED')).toEqual(['ACCEPTED', 'CANCELLED']);
    expect(allowedTransitions('IN_PROGRESS')).toEqual(['COMPLETED', 'CANCELLED']);
    expect(allowedTransitions('COMPLETED')).toEqual([]);
    expect(allowedTransitions('CANCELLED')).toEqual([]);
    expect(allowedTransitions('UNKNOWN')).toEqual([]);
  });
  it('acepta exclusivamente Admin y Cliente', () => {
    expect(tokenRoles({ roles: ['Operator', 'Customer', 'Admin', 'Cliente'] })).toEqual(['Admin', 'Cliente']);
    expect(tokenRoles({ roles: 'Admin' })).toEqual([]);
  });
  it('tolera JWT malformados y decodifica texto UTF-8', () => {
    expect(decodeJwtPayload('bad')).toEqual({});
    expect(decodeJwtPayload('x.??.y')).toEqual({});
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ name: 'María Ñúñez' })))).replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
    expect(decodeJwtPayload('header.' + payload + '.signature')['name']).toBe('María Ñúñez');
  });
  it('formatea CLP y fechas chilenas, manteniendo faltantes explícitos', () => {
    expect(new ClpPipe().transform(18412300)).toBe('$18.412.300');
    expect(new ClpPipe().transform(null)).toBe('No disponible');
    expect(new LocalDatePipe().transform('2026-11-17T12:00:00Z')).toBe('17-11-2026');
  });
});
