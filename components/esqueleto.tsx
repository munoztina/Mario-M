import { Encabezado } from "@/components/estructura";

/** Bloque gris que "respira" mientras cargan los datos. */
function B({ className }: { className: string }) {
  return <div className={"animate-pulse rounded-xl bg-zinc-100 " + className} />;
}

export function EsqueletoPanel() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <Encabezado titulo="Panel" />
      <B className="mb-3 h-4 w-32" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <B className="mb-2 h-3.5 w-24" />
            <B className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <B className="mb-4 h-4 w-32" />
        <div className="flex h-40 items-end gap-1">
          {[30, 55, 40, 70, 50, 80, 45, 65, 60, 75, 70, 90].map((h, i) => (
            <div key={i} className="flex-1 animate-pulse rounded-t-md bg-zinc-100" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function EsqueletoLista({ titulo, filtros }: { titulo: string; filtros?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <Encabezado titulo={titulo} />
      {filtros && (
        <div className="mb-3 flex gap-2">
          {["w-16", "w-20", "w-16", "w-24"].map((w, i) => (
            <B key={i} className={"h-8 " + w} />
          ))}
        </div>
      )}
      <ul className="space-y-2.5">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex justify-between gap-3">
              <B className="h-4 w-36" />
              <B className="h-4 w-16" />
            </div>
            <B className="mt-2 h-3.5 w-52" />
            <div className="mt-3 flex justify-between">
              <B className="h-3.5 w-24" />
              <B className="h-3.5 w-14" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EsqueletoFormulario({ titulo }: { titulo: string }) {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <Encabezado titulo={titulo} />
      <div className="space-y-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i}>
            <B className="mb-2 h-3.5 w-24" />
            <B className="h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
