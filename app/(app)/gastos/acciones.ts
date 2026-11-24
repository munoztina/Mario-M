"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/server";
import { CATEGORIAS_GASTO, type EstadoFormulario } from "@/lib/datos";
import { leerMonto, limpiarTexto } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";

export async function guardarGasto(id: string | null, _: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const datos = {
    fecha: String(form.get("fecha") ?? ""),
    concepto: limpiarTexto(form.get("concepto")),
    categoria: String(form.get("categoria") ?? ""),
    monto: leerMonto(form.get("monto")),
  };
  if (!datos.fecha) return { error: "Falta la fecha." };
  if (!datos.concepto) return { error: "Escribe en qué gastaste." };
  if (!CATEGORIAS_GASTO.includes(datos.categoria as never)) return { error: "Elige una categoría." };
  if (!datos.monto || datos.monto <= 0) return { error: "Escribe un monto mayor que 0 (ej. 15 o 15,50)." };

  const supabase = await crearClienteSupabase();
  const { error } = id
    ? await supabase.from("gastos").update(datos).eq("id", id)
    : await supabase.from("gastos").insert(datos);
  if (error) return { error: mensajeError(error) };

  revalidatePath("/", "layout");
  redirect(`/gastos?ok=${id ? "editado" : "creado"}`);
}

export async function borrarGasto(id: string) {
  const supabase = await crearClienteSupabase();
  const { error } = await supabase.from("gastos").delete().eq("id", id);
  if (error) throw new Error(mensajeError(error));
  revalidatePath("/", "layout");
  redirect("/gastos?ok=borrado");
}

/** Para deslizar: borra sin cambiar de pantalla. */
export async function eliminarGasto(id: string): Promise<EstadoFormulario> {
  const supabase = await crearClienteSupabase();
  const { error } = await supabase.from("gastos").delete().eq("id", id);
  if (error) return { error: mensajeError(error) };
  revalidatePath("/", "layout");
}
