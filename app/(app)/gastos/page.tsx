import { Aviso, BotonNuevo, Encabezado, Tarjeta, Vacio } from "@/components/estructura";
import { crearClienteSupabase } from "@/lib/supabase/server";
import type { Gasto } from "@/lib/datos";
import { formatoDinero, formatoFecha, nombreMes } from "@/lib/formato";

const AVISOS: Record<string, string> = {
  creado: "Gasto registrado.",
  editado: "Cambios guardados.",
  borrado: "Gasto borrado.",
};

export default async function Gastos({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const supabase = await crearClienteSupabase();
  const { data, error } = await supabase
    .from("gastos")
    .select("*")
    .order("fecha", { ascending: false })
    .order("id", { ascending: false })
    .limit(300);
  const gastos = (data ?? []) as Gasto[];

  // Agrupar por mes
  const meses = new Map<string, Gasto[]>();
  for (const g of gastos) {
    const k = g.fecha.slice(0, 7);
    meses.set(k, [...(meses.get(k) ?? []), g]);
  }

  return (
    <>
      <Encabezado titulo="Gastos" />
      <Aviso ok={ok ? AVISOS[ok] : undefined} />
      {error && <p className="mb-3 text-sm text-red-600">No se pudieron cargar los gastos: {error.message}</p>}
      {gastos.length === 0 ? (
        <Vacio texto="Aún no tienes gastos. Toca «+ Gasto» para registrar el primero." />
      ) : (
        <div className="space-y-6">
          {[...meses.entries()].map(([mes, lista]) => (
            <section key={mes}>
              <h2 className="mb-2 flex items-baseline justify-between px-1">
                <span className="font-semibold">{nombreMes(mes + "-01")}</span>
                <span className="text-sm text-zinc-600">
                  Total: <strong className="text-zinc-900">{formatoDinero(lista.reduce((s, g) => s + Number(g.monto), 0))}</strong>
                </span>
              </h2>
              <ul className="space-y-2">
                {lista.map((g) => (
                  <li key={g.id}>
                    <Tarjeta href={`/gastos/${g.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{g.concepto}</p>
                          <p className="text-sm text-zinc-500">
                            {formatoFecha(g.fecha)} · {g.categoria}
                          </p>
                        </div>
                        <strong className="shrink-0">{formatoDinero(g.monto)}</strong>
                      </div>
                    </Tarjeta>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <BotonNuevo href="/gastos/nuevo" texto="Gasto" />
    </>
  );
}
