// Listas fijas: deben coincidir con las reglas de la base de datos (migraciones).

export const TALLAS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

export const ESTADOS_PEDIDO = ["Por encargo", "Pagado", "Entregado", "Cancelado"] as const;

export const CATEGORIAS_GASTO = [
  "Compra a proveedor",
  "Envío China-Miami",
  "Casillero Miami",
  "Geomil",
  "Impuestos / aduana",
  "Publicidad",
  "Empaques",
  "Envío local",
  "Comisiones de pago",
  "Otros",
] as const;

export type Pedido = {
  id: number;
  fecha: string;
  cliente: string;
  modelo: string;
  equipo: string;
  talla: string;
  precio: number;
  anticipo: number;
  saldo: number;
  estado: string;
  notas: string | null;
  descontar: boolean;
};

export type Gasto = {
  id: number;
  fecha: string;
  concepto: string;
  categoria: string;
  monto: number;
};

export type ItemInventario = {
  id: number;
  modelo: string;
  equipo: string;
  talla: string;
  cantidad: number;
};

export type CostoModelo = {
  modelo: string;
  precio_venta: number;
};

export type EstadoFormulario = { error?: string } | undefined;
