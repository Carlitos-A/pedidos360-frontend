import { DisplayStatus, Order, ORDER_STATUSES, OrderStatus, Product } from './api.models';
type Data = Record<string, unknown>;
function record(value: unknown): Data {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Data) : {};
}
export function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
export function normalizeStatus(value: unknown): DisplayStatus {
  const status = String(value ?? '')
    .trim()
    .toUpperCase();
  const legacy: Record<string, OrderStatus> = {
    PENDIENTE: 'CREATED',
    EN_PREPARACION: 'IN_PROGRESS',
    ENTREGADO: 'COMPLETED',
  };
  return (
    legacy[status] ??
    (ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : 'UNKNOWN')
  );
}
export function adaptOrder(value: unknown): Order {
  const data = record(value);
  if (data['id'] === undefined || data['id'] === null) throw new Error('Pedido sin identificador');
  return {
    id: String(data['id']),
    customerName: String(data['customerName'] ?? data['cliente'] ?? ''),
    customerId: String(data['customerId'] ?? ''),
    customerTenantId: String(data['customerTenantId'] ?? ''),
    detail: String(data['detail'] ?? data['detalle'] ?? ''),
    total: nullableNumber(data['total']),
    status: normalizeStatus(data['status'] ?? data['estado']),
    rawStatus: String(data['status'] ?? data['estado'] ?? ''),
    createdAt: String(data['createdAt'] ?? data['fecha'] ?? ''),
    updatedAt: data['updatedAt'] ? String(data['updatedAt']) : undefined,
    history: Array.isArray(data['history'])
      ? data['history']
          .map((value) => {
            const event = record(value);
            return {
              status: normalizeStatus(event['status']),
              changedAt: String(event['changedAt'] ?? ''),
              actorName: String(event['actorName'] ?? ''),
              actorRole: event['actorRole'] ? String(event['actorRole']) : undefined,
            };
          })
          .sort((a, b) => b.changedAt.localeCompare(a.changedAt))
      : [],
    items: Array.isArray(data['items']) ? (data['items'] as Order['items']) : [],
  };
}
export function adaptProduct(value: unknown): Product {
  const data = record(value);
  if (data['id'] === undefined || data['id'] === null)
    throw new Error('Producto sin identificador');
  return {
    id: String(data['id']),
    name: String(data['name'] ?? data['nombre'] ?? ''),
    category: String(data['category'] ?? data['categoria'] ?? ''),
    price: nullableNumber(data['price'] ?? data['precio']),
    stock: nullableNumber(data['stock']),
    customerId: String(data['customerId'] ?? ''),
    customerTenantId: String(data['customerTenantId'] ?? ''),
  };
}
export function nextStatus(status: DisplayStatus): OrderStatus | null {
  return (
    (
      { CREATED: 'ACCEPTED', ACCEPTED: 'IN_PROGRESS', IN_PROGRESS: 'COMPLETED' } as Partial<
        Record<DisplayStatus, OrderStatus>
      >
    )[status] ?? null
  );
}
export function allowedTransitions(status: DisplayStatus): OrderStatus[] {
  const next = nextStatus(status);
  return next ? [next, 'CANCELLED'] : [];
}
export function ownsOrder(order: Order, user: { id: string; tenantId: string }): boolean {
  return Boolean(
    user.id &&
    user.tenantId &&
    order.customerId === user.id &&
    order.customerTenantId === user.tenantId,
  );
}
