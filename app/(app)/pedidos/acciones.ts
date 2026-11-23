"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/server";
import { ESTADOS_PEDIDO, TALLAS, type EstadoFormulario } from "@/lib/datos";
import { leerMonto, limpiarTexto } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";

export async function guardarPedido(
  id: number | null,
  _: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  const datos = {
    fecha: String(form.get("fecha") ?? ""),
    cliente: limpiarTexto(form.get("cliente")),
    modelo: limpiarTexto(form.get("modelo")),
    equipo: limpiarTexto(form.get("equipo")),
    talla: String(form.get("talla") ?? ""),
    precio: leerMonto(form.get("precio")),
    anticipo: leerMonto(form.get("anticipo")) ?? 0,
    estado: String(form.get("estado") ?? ""),
    notas: limpiarTexto(form.get("notas")) || null,
    descontar: form.get("origen") === "inventario",
  };

  if (!datos.fecha) return { error: "Falta la fecha." };
  if (!datos.cliente) return { error: "Escribe el nombre del cliente." };
  if (!datos.modelo || !datos.equipo) return { error: "Elige el modelo y escribe el equipo." };
  if (!TALLAS.includes(datos.talla as never)) return { error: "Elige una talla." };
  if (datos.precio === null) return { error: "Escribe un precio válido (ej. 25 o 25,50)." };
  if (datos.anticipo > datos.precio) return { error: "El anticipo no puede ser mayor que el precio." };
  if (!ESTADOS_PEDIDO.includes(datos.estado as never)) return { error: "Elige el estado del pedido." };

  const supabase = await crearClienteSupabase();
  const { error } = id
    ? await supabase.from("pedidos").update(datos).eq("id", id)
    : await supabase.from("pedidos").insert(datos);

  if (error) return { error: mensajeError(error) };

  revalidatePath("/pedidos");
  revalidatePath("/inventario");
  redirect(`/pedidos?ok=${id ? "editado" : "creado"}`);
}

export async function borrarPedido(id: number) {
  const supabase = await crearClienteSupabase();
  const { error } = await supabase.from("pedidos").delete().eq("id", id);
  if (error) throw new Error(mensajeError(error));
  revalidatePath("/pedidos");
  revalidatePath("/inventario");
  redirect("/pedidos?ok=borrado");
}
