import { Aviso, BotonNuevo, Encabezado, Tarjeta, Vacio } from "@/components/estructura";
import { crearClienteSupabase } from "@/lib/supabase/server";
import type { Lote } from "@/lib/datos";
import { formatoDinero, formatoFecha } from "@/lib/formato";
import { PasosLote } from "@/components/panel";

export default async function Lotes({ searchParams }: { searchParams: Promise<{ ok?: string; asignadas?: string }> }) {
  const { ok, asignadas } = await searchParams;
  const avisos: Record<string, string> = {
    creado: "Lote registrado.",
    editado: "Cambios guardados.",
    borrado: "Lote borrado.",
    recibido: `Lote recibido: las camisetas ya están en el inventario${Number(asignadas) ? ` y se asignaron ${asignadas} preventa(s)` : ""}.`,
  };
  const supabase = await crearClienteSupabase();
  const { data, error } = await supabase.from("lotes_resumen").select("*").order("fecha_pedido", { ascending: false }).limit(100);
  const lotes = (data ?? []) as Lote[];

  return (
    <>
      <Encabezado titulo="Lotes" />
      <Aviso ok={ok ? avisos[ok] : undefined} />
      {error && <p className="mb-3 text-sm text-red-600">No se pudieron cargar los lotes: {error.message}</p>}
      {lotes.length === 0 ? (
        <Vacio texto="Aún no tienes lotes. Toca «+ Lote» para registrar tu primera importación." />
      ) : (
        <ul className="space-y-2.5">
          {lotes.map((l) => {
            const total = Number(l.costo_proveedor) + Number(l.costo_envio_miami) + Number(l.costo_geomil ?? 0);
            return (
              <li key={l.id}>
                <Tarjeta href={`/lotes/${l.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {l.proveedor} · {l.unidades} camisetas
                      </p>
                      <p className="text-sm text-zinc-500">
                        Pedido {formatoFecha(l.fecha_pedido)} · {l.metodo_envio}
                        {l.guia ? ` · ${l.guia}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold">{formatoDinero(total)}</p>
                      <p className="text-xs text-zinc-500">{l.unidades ? `${formatoDinero(total / l.unidades!)} c/u` : ""}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <PasosLote estado={l.estado} />
                  </div>
                </Tarjeta>
              </li>
            );
          })}
        </ul>
      )}
      <BotonNuevo href="/lotes/nuevo" texto="Lote" />
    </>
  );
}
