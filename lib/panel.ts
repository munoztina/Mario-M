import { crearClienteSupabase } from "@/lib/supabase/server";
import { CUPO_4X4_ANUAL, STOCK_MINIMO, TALLAS, type ItemInventario, type Pedido } from "@/lib/datos";
import { hoyEcuador } from "@/lib/formato";

type PedidoConGanancia = Pedido & { ganancia: number; costo_unitario: number };

export type Mes = { clave: string; ventas: number; ganancia: number; unidades: number };

/** "2026-11" -> "2026-10" (mover n meses). */
function moverMes(clave: string, n: number) {
  const [a, m] = clave.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/** Junta todos los números del panel. */
export async function cargarPanel() {
  const hoy = hoyEcuador();
  const mesActual = hoy.slice(0, 7);
  const desde12 = moverMes(mesActual, -11) + "-01";
  const anio = hoy.slice(0, 4);

  const supabase = await crearClienteSupabase();
  const [ventas, pendientes, cobrar, inventario, gastosMes, comprasAnio, costos] = await Promise.all([
    supabase.from("pedidos_con_ganancia").select("*").gte("fecha", desde12).neq("estado", "Cancelado"),
    supabase.from("pedidos").select("*").neq("estado", "Cancelado").neq("estado", "Entregado").order("fecha"),
    supabase.from("pedidos").select("saldo").neq("estado", "Cancelado").gt("saldo", 0),
    supabase.from("inventario").select("*"),
    supabase.from("gastos").select("monto").gte("fecha", mesActual + "-01"),
    supabase.from("gastos").select("monto").eq("categoria", "Compra a proveedor").gte("fecha", `${anio}-01-01`).lt("fecha", `${Number(anio) + 1}-01-01`),
    supabase.from("costos_modelo").select("costo_proveedor"),
  ]);

  const error = [ventas, pendientes, cobrar, inventario, gastosMes, comprasAnio, costos].find((r) => r.error)?.error;
  const pedidos = (ventas.data ?? []) as PedidoConGanancia[];
  const suma = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + Number(f(x) ?? 0), 0);

  // --- Ventas por mes (últimos 12) ---
  const meses: Mes[] = Array.from({ length: 12 }, (_, i) => ({ clave: moverMes(mesActual, i - 11), ventas: 0, ganancia: 0, unidades: 0 }));
  for (const p of pedidos) {
    const m = meses.find((x) => x.clave === p.fecha.slice(0, 7));
    if (!m) continue;
    m.ventas += Number(p.precio);
    m.ganancia += Number(p.ganancia);
    m.unidades += 1;
  }
  const esteMes = meses[11];
  const mesAnterior = meses[10];

  // --- Modelos más vendidos (últimos 12 meses) ---
  const porModelo = new Map<string, number>();
  for (const p of pedidos) porModelo.set(p.modelo, (porModelo.get(p.modelo) ?? 0) + 1);
  const modelos = [...porModelo.entries()].map(([modelo, unidades]) => ({ modelo, unidades })).sort((a, b) => b.unidades - a.unidades);

  // --- Por cobrar y por entregar (todos los pedidos abiertos) ---
  const abiertos = (pendientes.data ?? []) as Pedido[];
  const conSaldo = (cobrar.data ?? []) as { saldo: number }[];
  const porCobrar = suma(conSaldo, (p) => p.saldo);
  const clientesPorCobrar = conSaldo.length;

  // --- Stock ---
  const items = (inventario.data ?? []) as ItemInventario[];
  const porTalla = TALLAS.map((talla) => ({ talla, unidades: suma(items.filter((i) => i.talla === talla), (i) => i.cantidad) })).filter(
    (t) => t.unidades > 0 || ["S", "M", "L", "XL"].includes(t.talla),
  );
  const pocas = items.filter((i) => i.cantidad > 0 && i.cantidad <= STOCK_MINIMO).sort((a, b) => a.cantidad - b.cantidad || a.equipo.localeCompare(b.equipo));
  const agotadas = items.filter((i) => i.cantidad === 0).length;
  const totalStock = suma(items, (i) => i.cantidad);

  // --- Cupo 4x4 ---
  const usado = suma(comprasAnio.data ?? [], (g) => g.monto as number);
  const costosProveedor = (costos.data ?? []).map((c) => Number(c.costo_proveedor)).filter((c) => c > 0);
  const costoPromedio = costosProveedor.length ? suma(costosProveedor, (c) => c) / costosProveedor.length : 0;
  const restante = Math.max(CUPO_4X4_ANUAL - usado, 0);

  return {
    error,
    mesActual,
    anio,
    esteMes,
    mesAnterior,
    gastosDelMes: suma(gastosMes.data ?? [], (g) => g.monto as number),
    meses,
    modelos,
    porCobrar,
    clientesPorCobrar,
    porEntregar: abiertos,
    porTalla,
    pocas,
    agotadas,
    totalStock,
    cupo: {
      limite: CUPO_4X4_ANUAL,
      usado,
      restante,
      porcentaje: (usado / CUPO_4X4_ANUAL) * 100,
      camisetasAprox: costoPromedio ? Math.floor(restante / costoPromedio) : null,
    },
  };
}
