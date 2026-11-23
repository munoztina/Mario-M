import Link from "next/link";
import { notFound } from "next/navigation";
import { Encabezado } from "@/components/estructura";
import { BotonBorrar } from "@/components/campos";
import { crearClienteSupabase } from "@/lib/supabase/server";
import { formatoDinero, formatoFecha, hoyEcuador } from "@/lib/formato";
import type { Lote, LoteItem, Pedido } from "@/lib/datos";
import { FormularioLote } from "../FormularioLote";
import { RecibirLote } from "../RecibirLote";
import { cargarOpcionesLote } from "../cargarOpciones";
import { borrarLote } from "../acciones";

export default async function VerLote({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteSupabase();
  const [{ data: lote }, { data: items }, opciones] = await Promise.all([
    supabase.from("lotes").select("*").eq("id", id).maybeSingle(),
    supabase.from("lote_items").select("*").eq("lote_id", id),
    cargarOpcionesLote(),
  ]);
  if (!lote) notFound();
  const filas = (items ?? []) as LoteItem[];
  const nombreModelo = (mid: string) => opciones.modelos.find((m) => m.id === mid)?.nombre ?? "";
  const unidades = filas.reduce((s, i) => s + i.cantidad, 0);

  if (lote.estado === "Recibido") {
    return (
      <>
        <Encabezado titulo="Lote recibido" volver="/lotes" />
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm">
          <p>
            <strong>{lote.proveedor}</strong> · {lote.metodo_envio} · pedido el {formatoFecha(lote.fecha_pedido)}
            {lote.fecha_llegada && <> · llegó el {formatoFecha(lote.fecha_llegada)}</>}
          </p>
          <p className="text-zinc-600">
            Proveedor {formatoDinero(lote.costo_proveedor)} · Envío {formatoDinero(lote.costo_envio_miami)} · Geomil {formatoDinero(lote.costo_geomil)} ({lote.peso_lb} lb)
          </p>
          <ul className="divide-y divide-zinc-100">
            {filas.map((i) => (
              <li key={i.id} className="flex justify-between gap-2 py-2">
                <span>
                  {i.cantidad} × {i.equipo} · {nombreModelo(i.modelo_id)} · {i.talla}
                </span>
                <span className="shrink-0 font-medium">{formatoDinero(i.costo_unitario)} c/u</span>
              </li>
            ))}
          </ul>
          <Link href="/inventario" className="block font-medium text-emerald-700">Ver en el inventario ›</Link>
        </div>
      </>
    );
  }

  // Preventas sin camiseta asignada que coinciden con algo de este lote.
  const { data: preventas } = await supabase
    .from("pedidos_detalle")
    .select("id, cliente, equipo, modelo, modelo_id, talla, fecha, inventario_id, estado")
    .is("inventario_id", null)
    .neq("estado", "Cancelado")
    .neq("estado", "Entregado")
    .order("fecha");
  const coinciden = ((preventas ?? []) as (Pedido & { modelo_id: string })[]).filter((p) =>
    filas.some((i) => i.modelo_id === p.modelo_id && i.talla === p.talla && i.equipo.toLowerCase() === p.equipo.toLowerCase()),
  );

  return (
    <>
      <Encabezado titulo={`Lote ${lote.proveedor} · ${formatoFecha(lote.fecha_pedido)}`} volver="/lotes" />
      <div className="mb-6">
        <RecibirLote loteId={id} preventas={coinciden} unidades={unidades} />
      </div>
      <h2 className="mb-3 font-semibold text-zinc-800">Editar lote</h2>
      <FormularioLote lote={lote as Lote} items={filas} hoy={hoyEcuador()} {...opciones} />
      <form action={borrarLote.bind(null, id)} className="mt-6">
        <BotonBorrar pregunta="¿Borrar este lote? No afecta al inventario porque aún no se recibió." />
      </form>
    </>
  );
}
