import Link from "next/link";
import { Encabezado } from "@/components/estructura";
import { BarrasHorizontales, Cifra, Columnas, Medidor, Seccion } from "@/components/panel";
import { GraficoVentasMes } from "@/components/graficos";
import { cargarPanel } from "@/lib/panel";
import { STOCK_MINIMO } from "@/lib/datos";
import { formatoDinero, formatoFecha, hoyEcuador } from "@/lib/formato";
import { cerrarSesion } from "@/app/login/acciones";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function comparacion(actual: number, anterior: number, mesAnterior: string) {
  if (anterior <= 0) return null;
  const cambio = ((actual - anterior) / anterior) * 100;
  const signo = cambio > 0 ? "▲" : cambio < 0 ? "▼" : "=";
  return `${signo} ${Math.abs(cambio).toFixed(0)}% vs ${mesAnterior}`;
}

function diasDesde(fecha: string, hoy: string) {
  return Math.round((Date.parse(hoy) - Date.parse(fecha)) / 86_400_000);
}

export default async function Panel() {
  const d = await cargarPanel();
  const hoy = hoyEcuador();
  const nombreMes = MESES[Number(d.mesActual.slice(5)) - 1];
  const nombreMesAnterior = MESES[Number(d.mesAnterior.clave.slice(5)) - 1];

  return (
    <>
      <Encabezado
        titulo="Panel"
        accion={
          <form action={cerrarSesion}>
            <button className="rounded-lg px-2 py-1 text-sm text-zinc-500 active:bg-zinc-100">Salir</button>
          </form>
        }
      />
      {d.error && <p className="mb-3 text-sm text-red-600">Algunos datos no se pudieron cargar: {d.error.message}</p>}

      <div className="space-y-3">
        <p className="px-1 text-sm font-medium capitalize text-zinc-500">{nombreMes} {d.mesActual.slice(0, 4)}</p>
        <div className="grid grid-cols-2 gap-3">
          <Cifra
            etiqueta="Ventas del mes"
            valor={formatoDinero(d.esteMes.ventas)}
            detalle={comparacion(d.esteMes.ventas, d.mesAnterior.ventas, nombreMesAnterior) ?? `${d.esteMes.unidades} camisetas`}
          />
          <Cifra
            etiqueta="Ganancia del mes"
            valor={formatoDinero(d.esteMes.ganancia)}
            detalle={
              d.esteMes.ventas > 0 ? `Margen ${Math.round((d.esteMes.ganancia / d.esteMes.ventas) * 100)}%` : "Precio − costo del modelo"
            }
          />
          <Cifra
            etiqueta="Por cobrar"
            valor={formatoDinero(d.porCobrar)}
            detalle={`${d.clientesPorCobrar} ${d.clientesPorCobrar === 1 ? "pedido" : "pedidos"} con saldo`}
            href="/pedidos"
          />
          <Cifra
            etiqueta="Por entregar"
            valor={String(d.porEntregar.length)}
            detalle={d.porEntregar.length === 1 ? "pedido pendiente" : "pedidos pendientes"}
            href="/pedidos"
          />
        </div>
        <p className="px-1 text-xs text-zinc-500">
          Gastos registrados este mes: <strong className="text-zinc-700">{formatoDinero(d.gastosDelMes)}</strong>. La ganancia ya descuenta el
          costo de cada camiseta (proveedor, envíos e impuestos de «costos_modelo»).
        </p>

        <Seccion titulo="Ventas por mes">
          <GraficoVentasMes meses={d.meses} />
        </Seccion>

        <Seccion titulo={`Cupo 4x4 de ${d.anio}`}>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold tabular-nums">{Math.round(d.cupo.porcentaje)}%</p>
            <p className="text-sm text-zinc-600 tabular-nums">
              {formatoDinero(d.cupo.usado)} de {formatoDinero(d.cupo.limite)}
            </p>
          </div>
          <Medidor porcentaje={d.cupo.porcentaje} />
          <p className="mt-2 text-sm text-zinc-600">
            Te quedan <strong className="text-zinc-900">{formatoDinero(d.cupo.restante)}</strong>
            {d.cupo.camisetasAprox !== null && <> (≈ {d.cupo.camisetasAprox} camisetas al costo promedio del proveedor)</>}.
          </p>
          <p className="mt-1 text-xs text-zinc-500">Suma de tus gastos «Compra a proveedor» de este año. El cupo se reinicia el 1 de enero.</p>
        </Seccion>

        <Seccion titulo="Por entregar" enlace={{ href: "/pedidos", texto: "Ver pedidos" }}>
          {d.porEntregar.length === 0 ? (
            <p className="text-sm text-zinc-500">No tienes pedidos pendientes de entregar. 🎉</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {d.porEntregar.slice(0, 6).map((p) => {
                const dias = diasDesde(p.fecha, hoy);
                return (
                  <li key={p.id}>
                    <Link href={`/pedidos/${p.id}`} className="flex items-center justify-between gap-3 py-2.5 active:bg-zinc-50">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{p.cliente}</span>
                        <span className="block truncate text-sm text-zinc-500">
                          {p.equipo} · {p.talla} · {p.estado}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-xs text-zinc-500">
                        {formatoFecha(p.fecha)}
                        <br />
                        {dias === 0 ? "hoy" : `hace ${dias} ${dias === 1 ? "día" : "días"}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {d.porEntregar.length > 6 && <p className="mt-2 text-sm text-zinc-500">y {d.porEntregar.length - 6} más…</p>}
        </Seccion>

        <Seccion titulo="Modelos más vendidos" enlace={{ href: "/pedidos", texto: "Últimos 12 meses" }}>
          {d.modelos.length === 0 ? (
            <p className="text-sm text-zinc-500">Todavía no hay ventas.</p>
          ) : (
            <BarrasHorizontales
              filas={d.modelos.map((m) => ({ nombre: m.modelo, valor: m.unidades, texto: `${m.unidades} unid.` }))}
            />
          )}
        </Seccion>

        <Seccion titulo="Stock por talla" enlace={{ href: "/inventario", texto: `${d.totalStock} en total` }}>
          <Columnas datos={d.porTalla.map((t) => ({ nombre: t.talla, valor: t.unidades }))} />

          {d.pocas.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
                <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#fab219] text-xs text-zinc-900">⚠</span>
                Quedan pocas ({STOCK_MINIMO} o menos)
              </p>
              <ul className="space-y-1 text-sm text-zinc-700">
                {d.pocas.slice(0, 8).map((i) => (
                  <li key={i.id} className="flex justify-between gap-2">
                    <Link href={`/inventario/${i.id}`} className="truncate">
                      {i.equipo} · {i.modelo} · <strong>{i.talla}</strong>
                    </Link>
                    <span className="shrink-0 font-semibold tabular-nums">{i.cantidad}</span>
                  </li>
                ))}
              </ul>
              {d.pocas.length > 8 && <p className="mt-1 text-xs text-zinc-500">y {d.pocas.length - 8} más</p>}
            </div>
          )}
          {d.agotadas > 0 && (
            <Link href="/inventario?ver=todo" className="mt-3 flex items-center gap-1.5 text-sm text-zinc-700">
              <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d03b3b] text-xs text-white">!</span>
              {d.agotadas} {d.agotadas === 1 ? "camiseta agotada" : "camisetas agotadas"} ›
            </Link>
          )}
        </Seccion>
      </div>
    </>
  );
}
