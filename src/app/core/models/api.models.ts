export const ORDER_STATUSES = [
  'CREATED',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type DisplayStatus = OrderStatus | 'UNKNOWN';
export interface StatusEvent {
  status: DisplayStatus;
  previousStatus?: DisplayStatus;
  changedAt: string;
  actorName: string;
  actorRole?: string;
}
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}
export interface Order {
  id: string;
  customerName: string;
  customerId: string;
  customerTenantId: string;
  detail: string;
  total: number | null;
  status: DisplayStatus;
  rawStatus: string;
  version: number | null;
  createdAt: string;
  updatedAt?: string;
  history: StatusEvent[];
  items: OrderItem[];
}
export interface OrderInput {
  customerName: string;
  customerId: string;
  customerTenantId: string;
  detail: string;
  total: number;
  items?: OrderItem[];
  requestId?: string;
  expectedVersion?: number;
}
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number | null;
  stock: number | null;
}
export interface ProductInput {
  name: string;
  category: string;
  price: number;
  stock: number;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface OrderNotification {
  id: number;
  orderId: number;
  message: string;
  occurredAt: string;
}
export interface OrderTicket {
  ticketNumber: string;
  orderId: number;
  customerName: string;
  total: number;
  createdAt: string;
  issuedAt: string;
  items: OrderItem[];
}
export interface OrderFilters {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
export interface Kpis {
  totalOrders: number | null;
  monthlySales: number | null;
  activeUsers: number | null;
  averageLeadTimeDays: number | null;
  pendingOrders: number | null;
  inProgressOrders: number | null;
  completedToday: number | null;
  totalSales: number | null;
  averageOrderValue: number | null;
  cancellationRate: number | null;
  completedOrders: number | null;
  byStatus: Partial<Record<OrderStatus, number>>;
  updatedAt?: string;
}
export interface SalesPoint {
  month: string;
  sales: number;
  orderCount: number;
}
export interface LeadTimePoint {
  month: string;
  days: number;
}
export interface TopProduct {
  productId: string;
  name: string;
  units: number;
}
export const AUDIT_TYPES = [
  'ORDER_CREATED',
  'ORDER_STATUS_CHANGED',
  'ORDER_CANCELLED',
  'ORDER_OWNER_CHANGED',
  'PRODUCT_UPDATED',
  'USER_LOGIN',
] as const;
export interface AuditEvent {
  id: string;
  type: string;
  description: string;
  actorEmail: string;
  occurredAt: string;
}
export interface AuditFilters {
  user?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
export interface HealthEntry {
  name: string;
  status: 'UP' | 'DOWN' | 'UNKNOWN';
}
