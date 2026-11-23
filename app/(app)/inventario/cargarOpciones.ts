import { crearClienteSupabase } from "@/lib/supabase/server";
import type { Modelo } from "@/lib/datos";

export async function cargarOpcionesInventario() {
  const supabase = await crearClienteSupabase();
  const [modelos, inv] = await Promise.all([
    supabase.from("modelos").select("*").order("orden"),
    supabase.from("inventario").select("equipo"),
  ]);
  return {
    modelos: (modelos.data ?? []) as Modelo[],
    equipos: [...new Set((inv.data ?? []).map((i) => i.equipo as string))].sort((a, b) => a.localeCompare(b, "es")),
  };
}
