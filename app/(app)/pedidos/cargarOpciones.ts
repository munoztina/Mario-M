import { crearClienteSupabase } from "@/lib/supabase/server";
import type { Cliente, ItemInventario, Modelo } from "@/lib/datos";

/** Datos que necesita el formulario de pedidos. */
export async function cargarOpcionesPedido() {
  const supabase = await crearClienteSupabase();
  const [modelos, stock, clientes] = await Promise.all([
    supabase.from("modelos").select("*").order("orden"),
    supabase.from("inventario_detalle").select("*"),
    supabase.from("clientes").select("id, nombre, whatsapp, instagram, ciudad").order("nombre"),
  ]);
  const inventario = (stock.data ?? []) as ItemInventario[];
  const { data: pedidosEquipos } = await supabase.from("pedidos").select("equipo").order("creado", { ascending: false }).limit(300);
  const equipos = [...new Set([...inventario.map((i) => i.equipo), ...(pedidosEquipos ?? []).map((p) => p.equipo as string)])].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  return {
    modelos: (modelos.data ?? []) as Modelo[],
    stock: inventario,
    clientes: (clientes.data ?? []) as Cliente[],
    equipos,
  };
}
