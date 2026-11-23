"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/server";
import { ESTADOS_LOTE, METODOS_ENVIO, PROVEEDORES, TALLAS, type EstadoFormulario, type LoteItem } from "@/lib/datos";
import { calcularLote } from "@/lib/costos";
import { hoyEcuador, leerMonto, limpiarTexto } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";

export async function guardarLote(id: string | null, _: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  let items: LoteItem[];
  try {
    items = (JSON.parse(String(form.get("items") ?? "[]")) as LoteItem[]).map((i) => ({
      modelo_id: i.modelo_id,
      equipo: limpiarTexto(i.equipo),
      talla: i.talla,
      cantidad: Math.trunc(Number(i.cantidad)),
      precio_unitario: Number(i.precio_unitario) || 0,
      extras: Number(i.extras) || 0,
    }));
  } catch {
    return { error: "No se pudieron leer las camisetas del lote." };
  }

  const datos = {
    fecha_pedido: String(form.get("fecha_pedido") ?? ""),
    proveedor: String(form.get("proveedor") ?? ""),
    metodo_envio: String(form.get("metodo_envio") ?? ""),
    descuento: leerMonto(form.get("descuento")) ?? 0,
    entrega_domicilio: form.get("entrega_domicilio") === "on",
    guia: limpiarTexto(form.get("guia")) || null,
    estado: String(form.get("estado") ?? ""),
    notas: limpiarTexto(form.get("notas")) || null,
  };
  if (!datos.fecha_pedido) return { error: "Falta la fecha del pedido." };
  if (!PROVEEDORES.includes(datos.proveedor as never)) return { error: "Elige el proveedor." };
  if (!METODOS_ENVIO.includes(datos.metodo_envio as never)) return { error: "Elige el método de envío." };
  if (!ESTADOS_LOTE.includes(datos.estado as never)) return { error: "Elige el estado del lote." };
  if (datos.descuento > 100) return { error: "El descuento es un porcentaje entre 0 y 100." };

  const supabase = await crearClienteSupabase();

  // Si el lote ya se recibió, sus camisetas ya están en el inventario: no se tocan.
  const { data: actual } = id ? await supabase.from("lotes").select("estado").eq("id", id).maybeSingle() : { data: null };
  if (actual?.estado === "Recibido") return { error: "Este lote ya se recibió en Quito y no se puede editar." };

  if (items.length === 0) return { error: "Agrega al menos una camiseta al lote." };
  for (const [n, i] of items.entries()) {
    if (!i.modelo_id || !i.equipo || !TALLAS.includes(i.talla as never)) return { error: `Completa modelo, equipo y talla de la fila ${n + 1}.` };
    if (!(i.cantidad > 0)) return { error: `La cantidad de la fila ${n + 1} debe ser 1 o más.` };
  }

  // Calcular costos con los pesos de cada modelo y los valores reales que se hayan escrito.
  const { data: modelos } = await supabase.from("modelos").select("id, peso_lb");
  const peso = new Map((modelos ?? []).map((m) => [m.id as string, Number(m.peso_lb)]));
  const c = calcularLote({
    items: items.map((i) => ({ ...i, peso_lb: peso.get(i.modelo_id) ?? 0 })),
    descuento: datos.descuento,
    metodo: datos.metodo_envio,
    domicilio: datos.entrega_domicilio,
    costoProveedor: leerMonto(form.get("costo_proveedor")),
    envioMiami: leerMonto(form.get("costo_envio_miami")),
    peso: leerMonto(form.get("peso_lb")),
    geomil: leerMonto(form.get("costo_geomil")),
  });

  const fila = { ...datos, costo_proveedor: c.proveedor, costo_envio_miami: c.envio, peso_lb: c.peso, costo_geomil: c.geomil };
  const guardado = id
    ? await supabase.from("lotes").update(fila).eq("id", id).select("id").single()
    : await supabase.from("lotes").insert(fila).select("id").single();
  if (guardado.error || !guardado.data) return { error: mensajeError(guardado.error) };
  const loteId = guardado.data.id as string;

  // Reemplazar las camisetas del lote con sus costos calculados.
  if (id) {
    const { error } = await supabase.from("lote_items").delete().eq("lote_id", loteId);
    if (error) return { error: mensajeError(error) };
  }
  const { error } = await supabase
    .from("lote_items")
    .insert(items.map((i, n) => ({ ...i, lote_id: loteId, costo_unitario: c.costos[n] })));
  if (error) return { error: mensajeError(error) };

  revalidatePath("/", "layout");
  redirect(`/lotes?ok=${id ? "editado" : "creado"}`);
}

export async function recibirLote(id: string, _: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const supabase = await crearClienteSupabase();
  const { data, error } = await supabase.rpc("recibir_lote", {
    p_lote: id,
    p_fecha: hoyEcuador(),
    p_pedidos: form.getAll("preventas").map(String),
  });
  if (error) return { error: error.hint === "lote_recibido" ? "Este lote ya fue recibido." : mensajeError(error) };
  revalidatePath("/", "layout");
  redirect(`/lotes?ok=recibido&asignadas=${Number(data) || 0}`);
}

export async function borrarLote(id: string) {
  const supabase = await crearClienteSupabase();
  const { data } = await supabase.from("lotes").select("estado").eq("id", id).maybeSingle();
  if (data?.estado === "Recibido") throw new Error("Un lote recibido no se puede borrar: sus camisetas ya están en el inventario.");
  const { error } = await supabase.from("lotes").delete().eq("id", id);
  if (error) throw new Error(mensajeError(error));
  revalidatePath("/", "layout");
  redirect("/lotes?ok=borrado");
}
