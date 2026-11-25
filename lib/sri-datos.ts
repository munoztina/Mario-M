import { crearClienteSupabase } from "@/lib/supabase/server";
import { hoyEcuador } from "@/lib/formato";
import { claveObligacion, diasHasta, obligacionesVisibles, urgencia, type Obligacion, type Urgencia } from "@/lib/sri";

export type Declaracion = { id: string; tipo: string; periodo: string; presentada_el: string; valor_pagado: number; notas: string | null };

export type Comprobante = {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  archivo: string;
  nombre_archivo: string | null;
  url?: string | null;
};

export type ObligacionConEstado = Obligacion & {
  dias: number;
  urgencia: Urgencia;
  declaracion: Declaracion | null;
  ventas: number; // ventas con IVA del período
  ventasSinIva: number;
  iva: number; // IVA cobrado (estimado con los pedidos)
};

async function declaracionesPresentadas() {
  const supabase = await crearClienteSupabase();
  const { data, error } = await supabase.from("declaraciones").select("*");
  const mapa = new Map<string, Declaracion>();
  for (const d of (data ?? []) as Declaracion[]) mapa.set(claveObligacion(d), d);
  return { mapa, error };
}

/** Aviso del panel: la próxima declaración pendiente. */
export async function cargarAvisoSri() {
  const hoy = hoyEcuador();
  // Si la tabla aún no existe (falta pegar el SQL del paso 4), igual se muestra el aviso.
  const { mapa } = await declaracionesPresentadas();
  const { proxima } = obligacionesVisibles(hoy, new Set(mapa.keys()));
  if (!proxima) return null;
  const dias = diasHasta(proxima.vence, hoy);
  return { ...proxima, dias, urgencia: urgencia(dias, false) };
}

/** Todo lo de la pantalla SRI. */
export async function cargarSri() {
  const hoy = hoyEcuador();
  const supabase = await crearClienteSupabase();
  const { mapa, error: errorDeclaraciones } = await declaracionesPresentadas();
  const { lista, proxima } = obligacionesVisibles(hoy, new Set(mapa.keys()));

  const desde = lista.reduce((m, o) => (o.desde < m ? o.desde : m), hoy);
  const [pedidos, comprobantes] = await Promise.all([
    supabase.from("pedidos_detalle").select("fecha, precio_venta, ingreso_neto").neq("estado", "Cancelado").gte("fecha", desde),
    supabase.from("comprobantes").select("*").order("fecha", { ascending: false }).order("creado", { ascending: false }).limit(200),
  ]);
  const ventas = (pedidos.data ?? []) as { fecha: string; precio_venta: number; ingreso_neto: number }[];

  const conEstado: ObligacionConEstado[] = lista.map((o) => {
    const delPeriodo = ventas.filter((v) => v.fecha >= o.desde && v.fecha <= o.hasta);
    const total = delPeriodo.reduce((s, v) => s + Number(v.precio_venta), 0);
    const sinIva = delPeriodo.reduce((s, v) => s + Number(v.ingreso_neto), 0);
    const declaracion = mapa.get(claveObligacion(o)) ?? null;
    const dias = diasHasta(o.vence, hoy);
    return { ...o, dias, urgencia: urgencia(dias, !!declaracion), declaracion, ventas: total, ventasSinIva: sinIva, iva: Math.round((total - sinIva) * 100) / 100 };
  });

  // Enlaces temporales (1 hora) para ver cada archivo: el espacio es privado.
  const lista_c = (comprobantes.data ?? []) as Comprobante[];
  if (lista_c.length > 0) {
    const { data: firmados } = await supabase.storage.from("comprobantes").createSignedUrls(lista_c.map((c) => c.archivo), 3600);
    const porRuta = new Map((firmados ?? []).map((f) => [f.path, f.signedUrl]));
    for (const c of lista_c) c.url = porRuta.get(c.archivo) ?? null;
  }

  return {
    hoy,
    obligaciones: conEstado,
    proxima: proxima ? conEstado.find((o) => claveObligacion(o) === claveObligacion(proxima)) ?? null : null,
    comprobantes: lista_c,
    // Si falta pegar el SQL del paso 4, estas tablas no existen todavía.
    faltaMigracion: !!errorDeclaraciones || !!comprobantes.error,
    error: pedidos.error,
  };
}
