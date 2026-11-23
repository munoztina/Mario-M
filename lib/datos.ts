// Listas fijas: deben coincidir con las reglas de la base de datos (migraciones).

export const TALLAS = ["S", "M", "L", "XL", "2XL", "3XL", "Niño"] as const;

export const ESTADOS_PEDIDO = ["Preventa", "Pagado", "Entregado", "Cancelado"] as const;

export const ENTREGAS = ["Quito en mano", "USFQ", "Servientrega"] as const;

export const CATEGORIAS_GASTO = [
  "Compra a proveedor",
  "Envío a Miami",
  "Geomil",
  "Envío local",
  "Publicidad",
  "Empaques",
  "Impuestos",
  "Otros",
] as const;

/** Estas categorías son "Mercadería" (ya están dentro del costo de cada camiseta). */
export const CATEGORIAS_MERCADERIA = ["Compra a proveedor", "Envío a Miami", "Geomil"];

/** IVA de Ecuador. Los precios al cliente lo incluyen. */
export const IVA = 0.15;

/** Precio sin IVA: precio / 1,15 */
export const sinIva = (precio: number) => Math.round((precio / (1 + IVA)) * 100) / 100;

/** Cupo anual del régimen 4x4 (valor FOB de compra), por año calendario. */
export const CUPO_4X4_ANUAL = 1600;
/** Alerta del cupo a partir de este porcentaje. */
export const CUPO_ALERTA_PORCENTAJE = 80;

/** Alerta de stock: avisa cuando quedan MENOS de esta cantidad. */
export const STOCK_ALERTA_MENOS_DE = 2;

export type Modelo = {
  id: string;
  nombre: string;
  orden: number;
  precio_proveedor: number;
  peso_lb: number;
  costo_estimado: number;
  precio_venta_sugerido: number;
};

export type Cliente = {
  id: string;
  nombre: string;
  instagram: string | null;
  whatsapp: string | null;
  ciudad: string | null;
};

/** Fila de la vista pedidos_detalle. */
export type Pedido = {
  id: string;
  fecha: string;
  cliente_id: string;
  cliente: string;
  cliente_whatsapp: string | null;
  cliente_instagram: string | null;
  cliente_ciudad: string | null;
  modelo_id: string;
  modelo: string;
  equipo: string;
  talla: string;
  personalizacion: string | null;
  precio_venta: number;
  anticipo: number;
  saldo: number;
  estado: string;
  entrega: string;
  costo: number;
  ingreso_neto: number;
  ganancia: number;
  inventario_id: string | null;
  notas: string | null;
};

export type Gasto = {
  id: string;
  fecha: string;
  concepto: string;
  categoria: string;
  monto: number;
  tipo: string;
};

/** Fila de la vista inventario_detalle. */
export type ItemInventario = {
  id: string;
  modelo_id: string;
  modelo: string;
  modelo_orden: number;
  equipo: string;
  talla: string;
  cantidad: number;
  costo_unitario: number;
};

export type EstadoFormulario = { error?: string } | undefined;
