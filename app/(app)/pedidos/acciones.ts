"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/server";
import { ENTREGAS, ESTADOS_PEDIDO, TALLAS, type EstadoFormulario } from "@/lib/datos";
import { leerMonto, limpiarTexto } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";

type Supabase = Awaited<ReturnType<typeof crearClienteSupabase>>;

/** Busca el cliente por nombre (sin importar mayúsculas); si no existe, lo crea. */
async function obtenerCliente(supabase: Supabase, form: FormData) {
  const nombre = limpiarTexto(form.get("cliente"));
  const extra = {
    whatsapp: limpiarTexto(form.get("whatsapp")) || null,
    instagram: limpiarTexto(form.get("instagram")).replace(/^@/, "") || null,
    ciudad: limpiarTexto(form.get("ciudad")) || null,
  };
  const { data: existente } = await supabase.from("clientes").select("*").ilike("nombre", nombre).maybeSingle();

  if (existente) {
    // Completar solo los datos que el cliente aún no tenía.
    const nuevos = Object.fromEntries(
      Object.entries(extra).filter(([k, v]) => v && !existente[k as keyof typeof existente]),
    );
    if (Object.keys(nuevos).length) await supabase.from("clientes").update(nuevos).eq("id", existente.id);
    return { id: existente.id as string };
  }
  const { data, error } = await supabase.from("clientes").insert({ nombre, ...extra }).select("id").single();
  if (error || !data) return { error: mensajeError(error) };
  return { id: data.id as string };
}

export async function guardarPedido(id: string | null, _: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const deStock = form.get("origen") === "stock";
  const datos = {
    fecha: String(form.get("fecha") ?? ""),
    precio_venta: leerMonto(form.get("precio_venta")),
    anticipo: leerMonto(form.get("anticipo")) ?? 0,
    estado: String(form.get("estado") ?? ""),
    entrega: String(form.get("entrega") ?? ""),
    personalizacion: limpiarTexto(form.get("personalizacion")) || null,
    notas: limpiarTexto(form.get("notas")) || null,
    inventario_id: deStock ? String(form.get("inventario_id") ?? "") || null : null,
    // En una venta de stock, la base de datos copia modelo/equipo/talla del inventario.
    modelo_id: String(form.get("modelo_id") ?? ""),
    equipo: limpiarTexto(form.get("equipo")),
    talla: String(form.get("talla") ?? ""),
  };

  if (!limpiarTexto(form.get("cliente"))) return { error: "Escribe el nombre del cliente." };
  if (!datos.fecha) return { error: "Falta la fecha." };
  if (deStock) {
    if (!datos.inventario_id) return { error: "Elige la camiseta del inventario." };
  } else {
    if (!datos.modelo_id) return { error: "Elige el modelo." };
    if (!datos.equipo) return { error: "Escribe el equipo." };
    if (!TALLAS.includes(datos.talla as never)) return { error: "Elige una talla." };
  }
  if (datos.precio_venta === null) return { error: "Escribe un precio válido (ej. 32 o 32,50)." };
  if (datos.anticipo > datos.precio_venta) return { error: "El anticipo no puede ser mayor que el precio." };
  if (!ESTADOS_PEDIDO.includes(datos.estado as never)) return { error: "Elige el estado del pedido." };
  if (!ENTREGAS.includes(datos.entrega as never)) return { error: "Elige cómo se entrega." };

  const supabase = await crearClienteSupabase();
  const cliente = await obtenerCliente(supabase, form);
  if ("error" in cliente) return { error: cliente.error };

  // Para stock, los campos del modelo los completa la base de datos; se envían
  // valores provisionales válidos que serán reemplazados.
  const fila = { ...datos, cliente_id: cliente.id };
  if (deStock) {
    const { data: inv } = await supabase.from("inventario").select("modelo_id, equipo, talla").eq("id", datos.inventario_id!).maybeSingle();
    if (!inv) return { error: "Esa camiseta ya no está en el inventario." };
    Object.assign(fila, inv);
  }

  const { error } = id
    ? await supabase.from("pedidos").update(fila).eq("id", id)
    : await supabase.from("pedidos").insert(fila);
  if (error) return { error: mensajeError(error) };

  revalidatePath("/", "layout");
  redirect(`/pedidos?ok=${id ? "editado" : "creado"}`);
}

export async function borrarPedido(id: string) {
  const supabase = await crearClienteSupabase();
  const { error } = await supabase.from("pedidos").delete().eq("id", id);
  if (error) throw new Error(mensajeError(error));
  revalidatePath("/", "layout");
  redirect("/pedidos?ok=borrado");
}
