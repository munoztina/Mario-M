import { crearClienteSupabase } from "@/lib/supabase/server";
import { CUPO_4X4_ANUAL, type Modelo } from "@/lib/datos";
import { hoyEcuador } from "@/lib/formato";

export async function cargarOpcionesLote() {
  const supabase = await crearClienteSupabase();
  const anio = hoyEcuador().slice(0, 4);
  const [modelos, inv, pedidos, compras] = await Promise.all([
    supabase.from("modelos").select("*").order("orden"),
    supabase.from("inventario").select("equipo"),
    supabase.from("pedidos").select("equipo").order("creado", { ascending: false }).limit(300),
    supabase.from("gastos").select("monto").eq("categoria", "Compra a proveedor").gte("fecha", `${anio}-01-01`).lt("fecha", `${Number(anio) + 1}-01-01`),
  ]);
  const usado = (compras.data ?? []).reduce((s, g) => s + Number(g.monto), 0);
  return {
    modelos: (modelos.data ?? []) as Modelo[],
    equipos: [...new Set([...(inv.data ?? []), ...(pedidos.data ?? [])].map((x) => x.equipo as string))].sort((a, b) => a.localeCompare(b, "es")),
    cupoRestante: Math.max(CUPO_4X4_ANUAL - usado, 0),
  };
}
