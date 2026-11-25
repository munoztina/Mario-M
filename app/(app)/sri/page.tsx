import { Encabezado } from "@/components/estructura";
import { Seccion } from "@/components/panel";
import { cargarSri, type ObligacionConEstado } from "@/lib/sri-datos";
import { textoDias, NOVENO_DIGITO_RUC, type Urgencia } from "@/lib/sri";
import { formatoDinero, formatoFecha } from "@/lib/formato";
import { BotonConfirmar, MarcarDeclarada, SubirComprobante } from "./componentes";
import { borrarComprobante, desmarcarDeclarada } from "./acciones";

const COLOR: Record<Urgencia, string> = {
  lista: "border-green-300 bg-green-50",
  normal: "border-zinc-200 bg-white",
  pronto: "border-amber-300 bg-amber-50",
  urgente: "border-red-200 bg-red-50",
};

function Estado({ o }: { o: ObligacionConEstado }) {
  const [texto, clase] = o.declaracion
    ? ["Declarada", "bg-green-50 text-green-700 ring-green-300"]
    : o.dias < 0
      ? ["Vencida", "bg-red-50 text-red-700 ring-red-200"]
      : o.urgencia === "normal"
        ? ["Pendiente", "bg-zinc-100 text-zinc-700 ring-zinc-300"]
        : ["Pronto", o.urgencia === "urgente" ? "bg-red-50 text-red-700 ring-red-200" : "bg-amber-50 text-amber-700 ring-amber-300"];
  return <span className={"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 " + clase}>{texto}</span>;
}

/** Lo que dicen tus pedidos sobre ese período (lo que vas a copiar en el SRI). */
function Montos({ o }: { o: ObligacionConEstado }) {
  if (o.tipo === "IVA") {
    return (
      <p className="text-sm text-zinc-600">
        Ventas {formatoDinero(o.ventas)} → IVA cobrado <strong className="text-zinc-900">{formatoDinero(o.iva)}</strong>
      </p>
    );
  }
  return (
    <p className="text-sm text-zinc-600">
      Ventas del año sin IVA <strong className="text-zinc-900">{formatoDinero(o.ventasSinIva)}</strong>
    </p>
  );
}

export default async function Sri() {
  const d = await cargarSri();
  const p = d.proxima;

  return (
    <>
      <Encabezado titulo="SRI" volver="/" />
      {d.faltaMigracion && (
        <p className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          Falta pegar en Supabase el archivo SQL del paso 4. Mientras tanto ves las fechas, pero no puedes marcar declaraciones ni subir comprobantes.
        </p>
      )}
      {d.error && <p className="mb-3 text-sm text-red-600">No se pudieron cargar las ventas: {d.error.message}</p>}

      <div className="space-y-3">
        {p ? (
          <section className={"rounded-2xl border p-4 shadow-sm " + COLOR[p.urgencia]}>
            <p className="text-sm text-zinc-500">Próxima declaración</p>
            <h2 className="mt-0.5 text-lg font-bold text-zinc-900">{p.nombre}</h2>
            <p className="mt-1 text-sm text-zinc-700">
              Hasta el <strong>{formatoFecha(p.vence)}</strong> · <strong>{textoDias(p.dias)}</strong>
            </p>
            <div className="mt-2">
              <Montos o={p} />
            </div>
            {p.tipo === "IVA" && (
              <p className="mt-1 text-xs text-zinc-500">
                Al IVA cobrado réstale el IVA de tus facturas de compra con tu RUC (Geomil, empaques…). Si no vendiste nada, igual declaras en $0.
              </p>
            )}
            {!d.faltaMigracion && <MarcarDeclarada tipo={p.tipo} periodo={p.periodo} sugerido={p.tipo === "IVA" ? p.iva : undefined} />}
          </section>
        ) : (
          <p className="rounded-2xl border border-green-300 bg-green-50 p-4 text-sm text-green-700">Estás al día con todas tus declaraciones. 🎉</p>
        )}

        <Seccion titulo="Tus declaraciones">
          <ul className="divide-y divide-zinc-100">
            {d.obligaciones.map((o) => (
              <li key={o.tipo + o.periodo} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{o.nombre}</p>
                    <p className="text-sm text-zinc-500">
                      Hasta el {formatoFecha(o.vence)}
                      {!o.declaracion && <> · {textoDias(o.dias)}</>}
                    </p>
                  </div>
                  <Estado o={o} />
                </div>
                <div className="mt-1">
                  {o.declaracion ? (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-zinc-600">
                        Declarada el {formatoFecha(o.declaracion.presentada_el)} · pagaste {formatoDinero(o.declaracion.valor_pagado)}
                      </p>
                      <form action={desmarcarDeclarada.bind(null, o.tipo, o.periodo)}>
                        <BotonConfirmar pregunta={`¿Marcar «${o.nombre}» como NO declarada?`} texto="Deshacer" />
                      </form>
                    </div>
                  ) : (
                    o.desde <= d.hoy && <Montos o={o} />
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-zinc-500">
            Tus fechas: día 28 (noveno dígito del RUC: {NOVENO_DIGITO_RUC}). Si cae sábado o domingo pasa al lunes; si es feriado, al siguiente día hábil.
            La app sigue tus declaraciones desde julio de 2026. Las anteriores revísalas en SRI en línea.
          </p>
        </Seccion>

        <details className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm">
          <summary className="cursor-pointer font-semibold text-zinc-900">¿Cómo se calcula?</summary>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
            <li>
              <strong>IVA cobrado</strong> = precio ÷ 1,15 × 0,15 de cada pedido no cancelado del semestre (por la fecha del pedido). Es una guía: lo exacto
              es lo de tus facturas emitidas.
            </li>
            <li>
              <strong>IVA a pagar</strong> = IVA cobrado − IVA de tus compras con factura a tu RUC.
            </li>
            <li>
              <strong>Renta (RIMPE)</strong>: se paga según lo que vendiste en el año. Confirma el valor en SRI en línea en marzo.
            </li>
          </ul>
        </details>

        <Seccion titulo="Comprobantes">
          {!d.faltaMigracion && <SubirComprobante />}
          {d.comprobantes.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">Aquí guardas las fotos o PDF de tus declaraciones y facturas. Solo tú puedes verlos.</p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {d.comprobantes.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 py-2.5">
                  <a href={c.url ?? undefined} target="_blank" rel="noreferrer" className="min-w-0 flex-1 active:opacity-70">
                    <span className="block truncate font-medium">{c.descripcion}</span>
                    <span className="block truncate text-sm text-zinc-500">
                      {formatoFecha(c.fecha)} · {c.tipo} · <span className="text-emerald-700">{c.url ? "Ver ›" : "no disponible"}</span>
                    </span>
                  </a>
                  <form action={borrarComprobante.bind(null, c.id)}>
                    <BotonConfirmar pregunta={`¿Borrar «${c.descripcion}»? El archivo se elimina para siempre.`} texto="Borrar" peligro />
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Seccion>
      </div>
    </>
  );
}
