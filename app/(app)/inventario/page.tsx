import Link from "next/link";
import { Aviso, BotonNuevo, Encabezado, Vacio } from "@/components/estructura";
import { claseInput } from "@/components/campos";
import { crearClienteSupabase } from "@/lib/supabase/server";
import { TALLAS, type ItemInventario } from "@/lib/datos";
import { formatoDinero } from "@/lib/formato";
import { ajustarCantidad } from "./acciones";

const AVISOS: Record<string, string> = {
  creado: "Camisetas agregadas al inventario.",
  sumado: "Ya existía: se sumó a la cantidad que tenías.",
  editado: "Cambios guardados.",
  borrado: "Borrado del inventario.",
};

export default async function Inventario({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string; ver?: string }> }) {
  const { q, ok, ver } = await searchParams;
  const supabase = await crearClienteSupabase();
  let consulta = supabase.from("inventario_detalle").select("*");
  if (q) consulta = consulta.ilike("equipo", `%${q}%`);
  if (ver !== "todo") consulta = consulta.gt("cantidad", 0);
  const { data, error } = await consulta;

  const orden = (t: string) => TALLAS.indexOf(t as (typeof TALLAS)[number]);
  const items = ((data ?? []) as ItemInventario[]).sort(
    (a, b) => a.equipo.localeCompare(b.equipo, "es") || a.modelo_orden - b.modelo_orden || orden(a.talla) - orden(b.talla),
  );
  const total = items.reduce((s, i) => s + i.cantidad, 0);

  // Agrupar por equipo + modelo
  const grupos = new Map<string, ItemInventario[]>();
  for (const i of items) {
    const k = `${i.equipo}|${i.modelo}`;
    grupos.set(k, [...(grupos.get(k) ?? []), i]);
  }

  const boton = "flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-xl font-semibold text-zinc-700 active:bg-zinc-100";

  return (
    <>
      <Encabezado
        titulo="Inventario"
        accion={
          <Link href="/modelos" className="rounded-lg px-2 py-1 text-sm font-medium text-emerald-700 active:bg-emerald-50">
            Modelos y costos
          </Link>
        }
      />
      <p className="-mt-2 mb-3 text-sm text-zinc-500">{total} camisetas en stock</p>
      <Aviso ok={ok ? AVISOS[ok] : undefined} />
      {error && <p className="mb-3 text-sm text-red-600">No se pudo cargar el inventario: {error.message}</p>}

      <form className="mb-3 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar equipo…" className={claseInput} />
        {ver === "todo" && <input type="hidden" name="ver" value="todo" />}
        <button className="h-12 shrink-0 rounded-xl bg-zinc-900 px-4 font-medium text-white">Buscar</button>
      </form>
      <p className="mb-3 text-sm">
        <Link
          href={`/inventario?${new URLSearchParams({ ...(q ? { q } : {}), ...(ver === "todo" ? {} : { ver: "todo" }) })}`}
          className="font-medium text-emerald-700"
        >
          {ver === "todo" ? "Ocultar agotadas" : "Mostrar también las agotadas"}
        </Link>
      </p>

      {items.length === 0 ? (
        <Vacio texto={q ? "No hay camisetas con ese nombre." : "No tienes camisetas en stock. Toca «+ Agregar»."} />
      ) : (
        <div className="space-y-3">
          {[...grupos.entries()].map(([k, lista]) => (
            <section key={k} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold">{lista[0].equipo}</h2>
              <p className="mb-2 text-sm text-zinc-500">{lista[0].modelo}</p>
              <ul className="divide-y divide-zinc-100">
                {lista.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-2">
                    <Link href={`/inventario/${i.id}`} className="flex flex-1 items-center gap-3 py-1">
                      <span className="w-12 rounded-lg bg-zinc-100 py-1 text-center text-sm font-semibold">{i.talla}</span>
                      <span className={"text-sm " + (i.cantidad === 0 ? "text-red-600" : "text-zinc-600")}>
                        {i.cantidad === 0 ? "Agotada" : `${i.cantidad} ${i.cantidad === 1 ? "unidad" : "unidades"}`}
                        <span className="block text-xs text-zinc-400">costo {formatoDinero(i.costo_unitario)}</span>
                      </span>
                    </Link>
                    <form action={ajustarCantidad.bind(null, i.id, -1)}>
                      <button className={boton} disabled={i.cantidad === 0} aria-label="Restar uno">−</button>
                    </form>
                    <span className="w-6 text-center font-semibold">{i.cantidad}</span>
                    <form action={ajustarCantidad.bind(null, i.id, 1)}>
                      <button className={boton} aria-label="Sumar uno">+</button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <BotonNuevo href="/inventario/nuevo" texto="Agregar" />
    </>
  );
}
