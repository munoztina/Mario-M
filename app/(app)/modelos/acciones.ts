"use server";

import { revalidatePath } from "next/cache";
import { crearClienteSupabase } from "@/lib/supabase/server";
import { leerMonto } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";

type Estado = { error?: string; ok?: boolean } | undefined;

export async function guardarModelo(id: string, _: Estado, form: FormData): Promise<Estado> {
  const datos = {
    precio_proveedor: leerMonto(form.get("precio_proveedor")),
    peso_lb: leerMonto(form.get("peso_lb")),
    costo_estimado: leerMonto(form.get("costo_estimado")),
    precio_venta_sugerido: leerMonto(form.get("precio_venta_sugerido")),
  };
  if (Object.values(datos).some((v) => v === null)) return { error: "Revisa que todos los números sean válidos." };

  const supabase = await crearClienteSupabase();
  const { error } = await supabase.from("modelos").update(datos).eq("id", id);
  if (error) return { error: mensajeError(error) };
  revalidatePath("/", "layout");
  return { ok: true };
}
