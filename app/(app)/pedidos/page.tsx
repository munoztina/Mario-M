import Link from "next/link";
import { Aviso, BotonNuevo, Encabezado, Tarjeta, Vacio } from "@/components/estructura";
import { crearClienteSupabase } from "@/lib/supabase/server";
import { ESTADOS_PEDIDO, type Pedido } from "@/lib/datos";
import { formatoDinero, formatoFecha } from "@/lib/formato";
import { cerrarSesion } from "@/app/login/acciones";

const COLOR_ESTADO: Record<string, string> = {
  "Por encargo": "bg-amber-100 text-amber-800",
  Pagado: "bg-sky-100 text-sky-800",
  Entregado: "bg-emerald-100 text-emerald-800",
  Cancelado: "bg-zinc-200 text-zinc-600 line-through",
};

const AVISOS: Record<string, string> = {
  creado: "Pedido registrado.",
  editado: "Cambios guardados.",
  borrado: "Pedido borrado.",
};

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ estado?: string; ok?: string }> }) {
  const { estado, ok } = await searchParams;
  const supabase = await crearClienteSupabase();

  let consulta = supabase
    .from("pedidos")
    .select("*")
    .order("fecha", { ascending: false })
    .order("id", { ascending: false })
    .limit(200);
  if (estado) consulta = consulta.eq("estado", estado);
  const { data, error } = await consulta;
  const pedidos = (data ?? []) as Pedido[];

  const porCobrar = pedidos
    .filter((p) => p.estado !== "Cancelado")
    .reduce((s, p) => s + Number(p.saldo), 0);

  const filtros = [{ v: "", t: "Todos" }, ...ESTADOS_PEDIDO.map((e) => ({ v: e, t: e }))];

  return (
    <>
      <Encabezado
        titulo="Pedidos"
        accion={
          <form action={cerrarSesion}>
            <button className="rounded-lg px-2 py-1 text-sm text-zinc-500 active:bg-zinc-100">Salir</button>
          </form>
        }
      />
      <Aviso ok={ok ? AVISOS[ok] : undefined} />
      {error && <p className="mb-3 text-sm text-red-600">No se pudieron cargar los pedidos: {error.message}</p>}

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {filtros.map((f) => (
          <Link
            key={f.t}
            href={f.v ? `/pedidos?estado=${encodeURIComponent(f.v)}` : "/pedidos"}
            className={
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium " +
              ((estado ?? "") === f.v ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700")
            }
          >
            {f.t}
          </Link>
        ))}
      </div>

      {porCobrar > 0 && (
        <p className="mb-3 text-sm text-zinc-600">
          Por cobrar{estado ? ` (${estado.toLowerCase()})` : ""}: <strong className="text-amber-700">{formatoDinero(porCobrar)}</strong>
        </p>
      )}

      {pedidos.length === 0 ? (
        <Vacio texto={estado ? "No hay pedidos con este estado." : "Aún no tienes pedidos. Toca «+ Pedido» para registrar el primero."} />
      ) : (
        <ul className="space-y-2.5">
          {pedidos.map((p) => (
            <li key={p.id}>
              <Tarjeta href={`/pedidos/${p.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.cliente}</p>
                    <p className="truncate text-sm text-zinc-600">
                      {p.equipo} · {p.modelo} · {p.talla}
                    </p>
                  </div>
                  <span className={"shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold " + (COLOR_ESTADO[p.estado] ?? "")}>
                    {p.estado}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-500">
                    {formatoFecha(p.fecha)}
                    {p.descontar ? " · de stock" : ""}
                  </span>
                  <span>
                    <strong>{formatoDinero(p.precio)}</strong>
                    {Number(p.saldo) > 0 && p.estado !== "Cancelado" && (
                      <span className="text-amber-700"> · debe {formatoDinero(p.saldo)}</span>
                    )}
                  </span>
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
      <BotonNuevo href="/pedidos/nuevo" texto="Pedido" />
    </>
  );
}
