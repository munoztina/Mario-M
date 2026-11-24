"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/server";
import { TALLAS, type EstadoFormulario } from "@/lib/datos";
import { leerMonto, limpiarTexto } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";

export async function guardarInventario(id: string | null, _: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const datos = {
    modelo_id: String(form.get("modelo_id") ?? ""),
    equipo: limpiarTexto(form.get("equipo")),
    talla: String(form.get("talla") ?? ""),
    cantidad: Number(form.get("cantidad")),
    costo_unitario: leerMonto(form.get("costo_unitario")),
  };
  if (!datos.modelo_id) return { error: "Elige el modelo." };
  if (!datos.equipo) return { error: "Escribe el equipo." };
  if (!TALLAS.includes(datos.talla as never)) return { error: "Elige una talla." };
  if (!Number.isInteger(datos.cantidad) || datos.cantidad < 0) return { error: "La cantidad debe ser 0 o más." };
  if (datos.costo_unitario === null) return { error: "Escribe el costo por camiseta (ej. 18,90)." };

  const supabase = await crearClienteSupabase();

  if (id) {
    const { error } = await supabase.from("inventario").update(datos).eq("id", id);
    if (error) return { error: mensajeError(error) };
    revalidatePath("/", "layout");
    redirect("/inventario?ok=editado");
  }

  // Si ya existe esa camiseta (mismo modelo, equipo y talla, sin lote), se suma a la cantidad
  // y el costo queda como promedio ponderado.
  const { data: existente } = await supabase
    .from("inventario")
    .select("id, cantidad, costo_unitario")
    .eq("modelo_id", datos.modelo_id)
    .eq("equipo", datos.equipo)
    .eq("talla", datos.talla)
    .is("lote_id", null)
    .maybeSingle();

  let error;
  if (existente) {
    const total = existente.cantidad + datos.cantidad;
    const costo = total > 0
      ? Math.round(((existente.cantidad * Number(existente.costo_unitario) + datos.cantidad * datos.costo_unitario) / total) * 100) / 100
      : datos.costo_unitario;
    ({ error } = await supabase.from("inventario").update({ cantidad: total, costo_unitario: costo }).eq("id", existente.id));
  } else {
    ({ error } = await supabase.from("inventario").insert(datos));
  }
  if (error) return { error: mensajeError(error) };

  revalidatePath("/", "layout");
  redirect(`/inventario?ok=${existente ? "sumado" : "creado"}`);
}

/** Botones rápidos − / + de la lista. */
export async function ajustarCantidad(id: string, cambio: 1 | -1) {
  const supabase = await crearClienteSupabase();
  const { data } = await supabase.from("inventario").select("cantidad").eq("id", id).single();
  if (!data) return;
  await supabase.from("inventario").update({ cantidad: Math.max(0, data.cantidad + cambio) }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function borrarInventario(id: string) {
  const supabase = await crearClienteSupabase();
  const { error } = await supabase.from("inventario").delete().eq("id", id);
  if (error) throw new Error(mensajeError(error));
  revalidatePath("/", "layout");
  redirect("/inventario?ok=borrado");
}

/** Para deslizar: borra sin cambiar de pantalla. */
export async function eliminarInventario(id: string): Promise<EstadoFormulario> {
  const supabase = await crearClienteSupabase();
  const { error } = await supabase.from("inventario").delete().eq("id", id);
  if (error) return { error: mensajeError(error) };
  revalidatePath("/", "layout");
}
