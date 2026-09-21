export interface Pedido {
  id?: number;
  cliente: string;
  detalle: string;
  total: number;
  estado: string;
  fecha?: string;
}
