import Link from "next/link";
import { Encabezado } from "@/components/estructura";
import { BarrasHorizontales, Cifra, Columnas, Medidor, PasosLote, Seccion } from "@/components/panel";
import { GraficoVentasMes } from "@/components/graficos";
import { NumeroAnimado } from "@/components/NumeroAnimado";
import { cargarPanel } from "@/lib/panel";
import { STOCK_ALERTA_MENOS_DE } from "@/lib/datos";
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
            valor={<NumeroAnimado valor={d.esteMes.ventas} tipo="dinero" />}
            detalle={comparacion(d.esteMes.ventas, d.mesAnterior.ventas, nombreMesAnterior) ?? "IVA incluido"}
          />
          <Cifra
            etiqueta="Ganancia del mes"
            valor={<NumeroAnimado valor={d.esteMes.ganancia} tipo="dinero" />}
            detalle={d.esteMes.ventas > 0 ? `Margen ${Math.round((d.esteMes.ganancia / d.detalleGanancia.ventasSinIva) * 100)}% sin IVA` : "Sin IVA y sin gastos operativos"}
          />
          <Cifra etiqueta="Camisetas vendidas" valor={<NumeroAnimado valor={d.esteMes.unidades} />} detalle="este mes" />
          <Cifra etiqueta="En stock" valor={<NumeroAnimado valor={d.totalStock} />} detalle="camisetas en Quito" href="/inventario" />
          <Cifra
            etiqueta="Por cobrar"
            valor={<NumeroAnimado valor={d.porCobrar} tipo="dinero" />}
            detalle={`${d.clientesPorCobrar} ${d.clientesPorCobrar === 1 ? "pedido" : "pedidos"} con saldo`}
            href="/pedidos"
          />
          <Cifra
            etiqueta="Por entregar"
            valor={<NumeroAnimado valor={d.porEntregar.length} />}
            detalle={d.porEntregar.length === 1 ? "pedido pendiente" : "pedidos pendientes"}
            href="/pedidos"
          />
        </div>
        <details className="px-1 text-xs text-zinc-500">
          <summary className="cursor-pointer">¿Cómo se calcula la ganancia?</summary>
          <p className="mt-1 leading-relaxed">
            Ventas sin IVA {formatoDinero(d.detalleGanancia.ventasSinIva)} − costo de las camisetas{" "}
            {formatoDinero(d.detalleGanancia.costo)} − gastos operativos {formatoDinero(d.detalleGanancia.operativos)} ={" "}
            <strong className="text-zinc-700">{formatoDinero(d.esteMes.ganancia)}</strong>. Los gastos de mercadería (proveedor, envío a
            Miami, Geomil) no se restan porque ya están en el costo de cada camiseta.
          </p>
        </details>

        <Seccion titulo="Ventas por mes">
          <GraficoVentasMes meses={d.meses} />
        </Seccion>

        <Seccion titulo={`Cupo 4x4 de ${d.anio}`}>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold tabular-nums"><NumeroAnimado valor={Math.round(d.cupo.porcentaje)} sufijo="%" /></p>
            <p className="text-sm text-zinc-600 tabular-nums">
              {formatoDinero(d.cupo.usado)} de {formatoDinero(d.cupo.limite)}
            </p>
          </div>
          <Medidor porcentaje={d.cupo.porcentaje} />
          <p className="mt-2 text-sm text-zinc-600">
            Te quedan <strong className="text-zinc-900">{formatoDinero(d.cupo.restante)}</strong>
            {d.cupo.camisetasAprox !== null && <> (≈ {d.cupo.camisetasAprox} camisetas al precio promedio del proveedor)</>}.
          </p>
          <p className="mt-1 text-xs text-zinc-500">Suma de tus gastos «Compra a proveedor» de este año (valor FOB). El cupo se reinicia el 1 de enero. Máximo por paquete: 8 lb y $400.</p>
        </Seccion>

        <Seccion titulo="Lotes en camino" enlace={{ href: "/lotes", texto: "Ver lotes" }}>
          {d.lotesEnCamino.length === 0 ? (
            <p className="text-sm text-zinc-500">No tienes lotes en camino.</p>
          ) : (
            <ul className="space-y-4">
              {d.lotesEnCamino.map((l) => {
                const dias = diasDesde(l.fecha_pedido, hoy);
                return (
                  <li key={l.id}>
                    <Link href={`/lotes/${l.id}`} className="block active:bg-zinc-50">
                      <span className="mb-1.5 flex justify-between gap-2 text-sm">
                        <span className="font-medium">
                          {l.proveedor} · {l.unidades} camisetas
                        </span>
                        <span className="text-zinc-500">{dias === 0 ? "pedido hoy" : `hace ${dias} ${dias === 1 ? "día" : "días"}`}</span>
                      </span>
                      <PasosLote estado={l.estado} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
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
            <BarrasHorizontales filas={d.modelos.map((m) => ({ nombre: m.nombre, valor: m.unidades, texto: `${m.unidades} unid.` }))} />
          )}
        </Seccion>

        {d.equipos.length > 0 && (
          <Seccion titulo="Equipos más vendidos" enlace={{ href: "/pedidos", texto: "Top 5" }}>
            <BarrasHorizontales filas={d.equipos.map((m) => ({ nombre: m.nombre, valor: m.unidades, texto: `${m.unidades} unid.` }))} />
          </Seccion>
        )}

        <Seccion titulo="Stock por talla" enlace={{ href: "/inventario", texto: `${d.totalStock} en total` }}>
          <Columnas datos={d.porTalla.map((t) => ({ nombre: t.talla, valor: t.unidades }))} />

          {d.pocas.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
                <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#fab219] text-xs text-black">⚠</span>
                Quedan pocas (menos de {STOCK_ALERTA_MENOS_DE})
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
              <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d03b3b] text-xs text-black">!</span>
              {d.agotadas} {d.agotadas === 1 ? "camiseta agotada" : "camisetas agotadas"} ›
            </Link>
          )}
        </Seccion>
      </div>
    </>
  );
}
