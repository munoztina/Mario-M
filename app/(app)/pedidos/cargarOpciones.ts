import { crearClienteSupabase } from "@/lib/supabase/server";
import type { CostoModelo, ItemInventario } from "@/lib/datos";

/** Datos que necesita el formulario de pedidos: modelos, stock y equipos ya usados. */
export async function cargarOpcionesPedido() {
  const supabase = await crearClienteSupabase();
  const [modelos, stock, equiposPedidos] = await Promise.all([
    supabase.from("costos_modelo").select("modelo, precio_venta").order("modelo"),
    supabase.from("inventario").select("id, modelo, equipo, talla, cantidad"),
    supabase.from("pedidos").select("equipo").order("creado", { ascending: false }).limit(300),
  ]);
  const inventario = (stock.data ?? []) as ItemInventario[];
  const equipos = [
    ...new Set([...inventario.map((i) => i.equipo), ...(equiposPedidos.data ?? []).map((p) => p.equipo as string)]),
  ].sort((a, b) => a.localeCompare(b, "es"));

  return { modelos: (modelos.data ?? []) as CostoModelo[], stock: inventario, equipos };
}
