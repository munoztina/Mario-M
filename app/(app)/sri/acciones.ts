"use server";

import { revalidatePath } from "next/cache";
import { crearClienteSupabase } from "@/lib/supabase/server";
import { TIPOS_COMPROBANTE, type EstadoFormulario } from "@/lib/datos";
import { hoyEcuador, leerMonto, limpiarTexto } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";
import { obligaciones, SRI_DESDE, type TipoDeclaracion } from "@/lib/sri";

function esObligacionValida(tipo: string, periodo: string) {
  const anio = Number(periodo.slice(0, 4));
  return obligaciones(Number(SRI_DESDE.slice(0, 4)), anio).some((o) => o.tipo === tipo && o.periodo === periodo);
}

/** Botón "Ya declaré". */
export async function marcarDeclarada(tipo: TipoDeclaracion, periodo: string, _: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  if (!esObligacionValida(tipo, periodo)) return { error: "Esa declaración no existe." };
  const fecha = String(form.get("presentada_el") ?? "") || hoyEcuador();
  const valor = String(form.get("valor_pagado") ?? "").trim() ? leerMonto(form.get("valor_pagado")) : 0;
  if (valor === null || valor < 0) return { error: "Escribe cuánto pagaste (ej. 0, 15 o 15,50)." };
  if (fecha > hoyEcuador()) return { error: "La fecha no puede ser en el futuro." };

  const supabase = await crearClienteSupabase();
  const { error } = await supabase
    .from("declaraciones")
    .upsert({ tipo, periodo, presentada_el: fecha, valor_pagado: valor, notas: limpiarTexto(form.get("notas")) || null }, { onConflict: "tipo,periodo" });
  if (error) return { error: mensajeError(error) };
  revalidatePath("/", "layout");
}

/** Deshacer "Ya declaré". */
export async function desmarcarDeclarada(tipo: TipoDeclaracion, periodo: string) {
  const supabase = await crearClienteSupabase();
  const { error } = await supabase.from("declaraciones").delete().eq("tipo", tipo).eq("periodo", periodo);
  if (error) throw new Error(mensajeError(error));
  revalidatePath("/", "layout");
}

/** Guarda los datos de un comprobante cuyo archivo ya se subió desde el celular. */
export async function registrarComprobante(datos: {
  fecha: string;
  tipo: string;
  descripcion: string;
  archivo: string;
  nombre_archivo: string;
}): Promise<EstadoFormulario> {
  const descripcion = limpiarTexto(datos.descripcion);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha)) return { error: "Falta la fecha." };
  if (!TIPOS_COMPROBANTE.includes(datos.tipo as never)) return { error: "Elige qué tipo de comprobante es." };
  if (!descripcion) return { error: "Escribe una descripción corta (ej. «Factura Geomil lote 1»)." };
  if (!/^\d{4}\/[0-9a-f-]{36}\.[a-z0-9]{2,5}$/.test(datos.archivo)) return { error: "El archivo no es válido." };

  const supabase = await crearClienteSupabase();
  const { error } = await supabase.from("comprobantes").insert({
    fecha: datos.fecha,
    tipo: datos.tipo,
    descripcion,
    archivo: datos.archivo,
    nombre_archivo: limpiarTexto(datos.nombre_archivo).slice(0, 200) || null,
  });
  if (error) {
    await supabase.storage.from("comprobantes").remove([datos.archivo]);
    return { error: mensajeError(error) };
  }
  revalidatePath("/sri");
}

export async function borrarComprobante(id: string) {
  const supabase = await crearClienteSupabase();
  const { data, error } = await supabase.from("comprobantes").delete().eq("id", id).select("archivo").single();
  if (error) throw new Error(mensajeError(error));
  await supabase.storage.from("comprobantes").remove([data.archivo as string]);
  revalidatePath("/sri");
}
