import { crearClienteSupabase } from "@/lib/supabase/server";

export async function cargarOpcionesInventario() {
  const supabase = await crearClienteSupabase();
  const [modelos, inv] = await Promise.all([
    supabase.from("costos_modelo").select("modelo").order("modelo"),
    supabase.from("inventario").select("equipo"),
  ]);
  return {
    modelos: (modelos.data ?? []).map((m) => m.modelo as string),
    equipos: [...new Set((inv.data ?? []).map((i) => i.equipo as string))].sort((a, b) => a.localeCompare(b, "es")),
  };
}
