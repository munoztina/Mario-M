import { crearClienteSupabase } from "@/lib/supabase/server";
import { CUPO_4X4_ANUAL, STOCK_ALERTA_MENOS_DE, TALLAS, type ItemInventario, type Lote, type Pedido } from "@/lib/datos";
import { hoyEcuador } from "@/lib/formato";

export type Mes = { clave: string; ventas: number; ganancia: number; unidades: number; operativos: number };

/** "2026-11" movido n meses -> "2026-10" */
export function moverMes(clave: string, n: number) {
  const [a, m] = clave.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + n, 1)).toISOString().slice(0, 7);
}

const suma = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + Number(f(x) ?? 0), 0);

/**
 * Junta todos los números del panel.
 * Ganancia del mes = Σ (precio/1,15 − costo) de pedidos no cancelados − gastos operativos del mes.
 */
export async function cargarPanel(mesPedido?: string) {
  const hoy = hoyEcuador();
  const mesHoy = hoy.slice(0, 7);
  // Mes elegido (formato aaaa-mm); si no es válido o es futuro, el mes actual.
  const mesActual = mesPedido && /^\d{4}-(0[1-9]|1[0-2])$/.test(mesPedido) && mesPedido <= mesHoy ? mesPedido : mesHoy;
  const desde12 = moverMes(mesActual, -11) + "-01";
  const hasta = moverMes(mesActual, 1) + "-01"; // primer día del mes siguiente
  const anio = mesActual.slice(0, 4);

  const supabase = await crearClienteSupabase();
  const [ventas, pendientes, cobrar, inventario, operativos, comprasAnio, costos, lotes] = await Promise.all([
    supabase.from("pedidos_detalle").select("*").gte("fecha", desde12).lt("fecha", hasta).neq("estado", "Cancelado"),
    supabase.from("pedidos_detalle").select("*").neq("estado", "Cancelado").neq("estado", "Entregado").order("fecha"),
    supabase.from("pedidos").select("saldo").neq("estado", "Cancelado").gt("saldo", 0),
    supabase.from("inventario_detalle").select("*"),
    supabase.from("gastos").select("fecha, monto").eq("tipo", "Operativo").gte("fecha", desde12).lt("fecha", hasta),
    supabase.from("gastos").select("monto").eq("categoria", "Compra a proveedor").gte("fecha", `${anio}-01-01`).lt("fecha", `${Number(anio) + 1}-01-01`),
    supabase.from("modelos").select("precio_proveedor"),
    supabase.from("lotes_resumen").select("*").neq("estado", "Recibido").order("fecha_pedido"),
  ]);
  const error = [ventas, pendientes, cobrar, inventario, operativos, comprasAnio, costos, lotes].find((r) => r.error)?.error;
  const pedidos = (ventas.data ?? []) as Pedido[];

  // --- Por mes (últimos 12) ---
  const meses: Mes[] = Array.from({ length: 12 }, (_, i) => ({ clave: moverMes(mesActual, i - 11), ventas: 0, ganancia: 0, unidades: 0, operativos: 0 }));
  const delMes = (fecha: string) => meses.find((x) => x.clave === fecha.slice(0, 7));
  for (const p of pedidos) {
    const m = delMes(p.fecha);
    if (!m) continue;
    m.ventas += Number(p.precio_venta);
    m.ganancia += Number(p.ganancia);
    m.unidades += 1;
  }
  for (const g of operativos.data ?? []) {
    const m = delMes(g.fecha as string);
    if (m) m.operativos += Number(g.monto);
  }
  for (const m of meses) m.ganancia -= m.operativos;
  const esteMes = meses[11];
  const pedidosMes = pedidos.filter((p) => p.fecha.startsWith(mesActual));

  // --- Más vendidos (últimos 12 meses) ---
  const contar = (clave: (p: Pedido) => string) => {
    const mapa = new Map<string, number>();
    for (const p of pedidos) mapa.set(clave(p), (mapa.get(clave(p)) ?? 0) + 1);
    return [...mapa.entries()].map(([nombre, unidades]) => ({ nombre, unidades })).sort((a, b) => b.unidades - a.unidades);
  };

  // --- Por cobrar ---
  const conSaldo = (cobrar.data ?? []) as { saldo: number }[];

  // --- Stock ---
  const items = (inventario.data ?? []) as ItemInventario[];
  const porTalla = TALLAS.map((talla) => ({ talla, unidades: suma(items.filter((i) => i.talla === talla), (i) => i.cantidad) })).filter(
    (t) => t.unidades > 0 || ["S", "M", "L", "XL"].includes(t.talla),
  );
  const modelosConStock = [...new Map(items.filter((i) => i.cantidad > 0).map((i) => [i.modelo_id, i])).values()]
    .sort((a, b) => a.modelo_orden - b.modelo_orden)
    .map((i) => i.modelo);
  const tallasTabla = TALLAS.filter((t) => ["S", "M", "L", "XL"].includes(t) || items.some((i) => i.talla === t && i.cantidad > 0));
  const stockTabla = modelosConStock.map((modelo) => ({
    modelo,
    celdas: tallasTabla.map((talla) => suma(items.filter((i) => i.modelo === modelo && i.talla === talla), (i) => i.cantidad)),
  }));
  const pocas = items
    .filter((i) => i.cantidad > 0 && i.cantidad < STOCK_ALERTA_MENOS_DE)
    .sort((a, b) => a.cantidad - b.cantidad || a.equipo.localeCompare(b.equipo));

  // --- Cupo 4x4 ---
  const usado = suma(comprasAnio.data ?? [], (g) => g.monto as number);
  const preciosProveedor = (costos.data ?? []).map((c) => Number(c.precio_proveedor)).filter((c) => c > 0);
  const precioPromedio = preciosProveedor.length ? suma(preciosProveedor, (c) => c) / preciosProveedor.length : 0;
  const restante = Math.max(CUPO_4X4_ANUAL - usado, 0);

  return {
    error,
    mesHoy,
    mesActual,
    anio,
    esteMes,
    mesAnterior: meses[10],
    detalleGanancia: {
      ventasSinIva: suma(pedidosMes, (p) => p.ingreso_neto),
      costo: suma(pedidosMes, (p) => p.costo),
      operativos: esteMes.operativos,
    },
    meses,
    modelos: contar((p) => p.modelo),
    equipos: contar((p) => p.equipo).slice(0, 5),
    porCobrar: suma(conSaldo, (p) => p.saldo),
    clientesPorCobrar: conSaldo.length,
    porEntregar: (pendientes.data ?? []) as Pedido[],
    porTalla,
    tallasTabla,
    stockTabla,
    lotesEnCamino: (lotes.data ?? []) as Lote[],
    pocas,
    agotadas: items.filter((i) => i.cantidad === 0).length,
    totalStock: suma(items, (i) => i.cantidad),
    cupo: {
      limite: CUPO_4X4_ANUAL,
      usado,
      restante,
      porcentaje: (usado / CUPO_4X4_ANUAL) * 100,
      camisetasAprox: precioPromedio ? Math.floor(restante / precioPromedio) : null,
    },
  };
}
