import Link from "next/link";
import type { ReactNode } from "react";
import { CUPO_ALERTA_PORCENTAJE } from "@/lib/datos";

export function Seccion({ titulo, enlace, children }: { titulo: string; enlace?: { href: string; texto: string }; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-zinc-900">{titulo}</h2>
        {enlace && (
          <Link href={enlace.href} className="text-sm font-medium text-emerald-700">
            {enlace.texto}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Número grande con su etiqueta. */
export function Cifra({ etiqueta, valor, detalle, href }: { etiqueta: string; valor: string; detalle?: ReactNode; href?: string }) {
  const cuerpo = (
    <>
      <p className="text-sm text-zinc-500">{etiqueta}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-zinc-900">{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-zinc-500">{detalle}</p>}
    </>
  );
  const clase = "block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm";
  return href ? (
    <Link href={href} className={clase + " active:bg-zinc-50"}>
      {cuerpo}
    </Link>
  ) : (
    <div className={clase}>{cuerpo}</div>
  );
}

/** Barras horizontales ordenadas: nombre, barra y cifra en cada fila. */
export function BarrasHorizontales({ filas }: { filas: { nombre: string; valor: number; texto: string }[] }) {
  const max = Math.max(...filas.map((f) => f.valor), 1);
  return (
    <ul className="space-y-2.5">
      {filas.map((f) => (
        <li key={f.nombre}>
          <div className="mb-1 flex justify-between gap-2 text-sm">
            <span className="text-zinc-700">{f.nombre}</span>
            <span className="font-semibold tabular-nums text-zinc-900">{f.texto}</span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(f.valor / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Columnas pequeñas con la cifra encima (pocas barras, en orden natural). */
export function Columnas({ datos }: { datos: { nombre: string; valor: number }[] }) {
  const max = Math.max(...datos.map((d) => d.valor), 1);
  return (
    <div className="flex h-32 items-end gap-[2px]" role="list">
      {datos.map((d) => (
        <div key={d.nombre} role="listitem" className="flex h-full flex-1 flex-col items-center justify-end" aria-label={`Talla ${d.nombre}: ${d.valor}`}>
          <span className="mb-1 text-sm font-semibold tabular-nums text-zinc-900">{d.valor}</span>
          <span
            className="block w-full max-w-10 rounded-t-[4px] bg-emerald-600"
            style={{ height: d.valor > 0 ? `max(${(d.valor / max) * 75}%, 3px)` : 0 }}
          />
          <span className="mt-1 text-xs font-medium text-zinc-600">{d.nombre}</span>
        </div>
      ))}
    </div>
  );
}

const NIVELES = {
  bien: { color: "#0ca30c", icono: "✓", texto: "Vas bien" },
  cuidado: { color: "#fab219", icono: "⚠", texto: "Pasaste el 80% del cupo" },
  critico: { color: "#d03b3b", icono: "⛔", texto: "Cupo agotado: lo siguiente debe ser importación formal" },
} as const;

/** Medidor del cupo: barra de progreso con estado (color + ícono + texto). */
export function Medidor({ porcentaje }: { porcentaje: number }) {
  const nivel = porcentaje >= 100 ? NIVELES.critico : porcentaje >= CUPO_ALERTA_PORCENTAJE ? NIVELES.cuidado : NIVELES.bien;
  return (
    <div>
      <div
        className="h-4 overflow-hidden rounded-full bg-zinc-100"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(porcentaje)}
        aria-label="Cupo 4x4 usado"
      >
        <div className="h-full rounded-full" style={{ width: `${Math.min(porcentaje, 100)}%`, background: nivel.color }} />
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
        <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-white" style={{ background: nivel.color }}>
          {nivel.icono}
        </span>
        {nivel.texto}
      </p>
    </div>
  );
}

const PASOS = ["Pedido", "En Miami", "En Quito", "Recibido"];

/** Barra de 4 pasos del recorrido del lote: Pedido → En Miami → En Quito → Recibido. */
export function PasosLote({ estado }: { estado: string }) {
  const actual = PASOS.indexOf(estado);
  return (
    <div aria-label={`Estado: ${estado}`}>
      <div className="flex gap-[2px]">
        {PASOS.map((p, i) => (
          <span key={p} className={"h-1.5 flex-1 rounded-full " + (i <= actual ? "bg-emerald-600" : "bg-zinc-200")} />
        ))}
      </div>
      <div className="mt-1 flex text-[11px]">
        {PASOS.map((p, i) => (
          <span key={p} className={"flex-1 " + (i === actual ? "font-semibold text-zinc-900" : "text-zinc-400")}>
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
