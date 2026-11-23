"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/server";
import { TALLAS, type EstadoFormulario } from "@/lib/datos";
import { limpiarTexto } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";

export async function guardarInventario(id: number | null, _: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const datos = {
    modelo: limpiarTexto(form.get("modelo")),
    equipo: limpiarTexto(form.get("equipo")),
    talla: String(form.get("talla") ?? ""),
    cantidad: Number(form.get("cantidad")),
  };
  if (!datos.modelo) return { error: "Elige el modelo." };
  if (!datos.equipo) return { error: "Escribe el equipo." };
  if (!TALLAS.includes(datos.talla as never)) return { error: "Elige una talla." };
  if (!Number.isInteger(datos.cantidad) || datos.cantidad < 0) return { error: "La cantidad debe ser 0 o más." };

  const supabase = await crearClienteSupabase();

  if (id) {
    const { error } = await supabase.from("inventario").update(datos).eq("id", id);
    if (error) return { error: mensajeError(error) };
    revalidatePath("/inventario");
    redirect("/inventario?ok=editado");
  }

  // Nuevo: si ya existe esa camiseta (mismo modelo, equipo y talla), se suma a la cantidad.
  const { data: existente } = await supabase
    .from("inventario")
    .select("id, cantidad")
    .eq("modelo", datos.modelo)
    .eq("equipo", datos.equipo)
    .eq("talla", datos.talla)
    .maybeSingle();

  const { error } = existente
    ? await supabase.from("inventario").update({ cantidad: existente.cantidad + datos.cantidad }).eq("id", existente.id)
    : await supabase.from("inventario").insert(datos);
  if (error) return { error: mensajeError(error) };

  revalidatePath("/inventario");
  redirect(`/inventario?ok=${existente ? "sumado" : "creado"}`);
}

/** Botones rápidos − / + de la lista. */
export async function ajustarCantidad(id: number, cambio: 1 | -1) {
  const supabase = await crearClienteSupabase();
  const { data } = await supabase.from("inventario").select("cantidad").eq("id", id).single();
  if (!data) return;
  const nueva = Math.max(0, data.cantidad + cambio);
  await supabase.from("inventario").update({ cantidad: nueva }).eq("id", id);
  revalidatePath("/inventario");
}

export async function borrarInventario(id: number) {
  const supabase = await crearClienteSupabase();
  const { error } = await supabase.from("inventario").delete().eq("id", id);
  if (error) throw new Error(mensajeError(error));
  revalidatePath("/inventario");
  redirect("/inventario?ok=borrado");
}
