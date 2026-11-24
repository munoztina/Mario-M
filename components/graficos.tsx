"use client";

import { useState } from "react";
import { formatoDinero } from "@/lib/formato";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

type Mes = { clave: string; ventas: number; ganancia: number; unidades: number; operativos: number };

/** Escala "bonita" para el eje: 0, 250, 500… */
function maximoRedondo(v: number) {
  if (v <= 0) return 100;
  const pot = 10 ** Math.floor(Math.log10(v));
  for (const f of [1, 2, 2.5, 5, 10]) if (f * pot >= v) return f * pot;
  return 10 * pot;
}

/**
 * Columnas de ventas por mes. Tocar una columna muestra su detalle arriba
 * (en el celular no hay "pasar el mouse", así que se toca).
 */
export function GraficoVentasMes({ meses }: { meses: Mes[] }) {
  const [sel, setSel] = useState(meses.length - 1);
  const max = maximoRedondo(Math.max(...meses.map((m) => m.ventas)));
  const m = meses[sel];
  const [a, mm] = m.clave.split("-").map(Number);

  return (
    <div>
      <div className="mb-3 min-h-14" aria-live="polite">
        <p className="text-sm text-zinc-500">
          {MESES_LARGOS[mm - 1]} {a}
        </p>
        <p className="text-lg font-semibold text-zinc-900">
          {formatoDinero(m.ventas)} <span className="text-sm font-normal text-zinc-500">en ventas</span>
        </p>
        <p className="text-sm text-zinc-600">
          Ganancia {formatoDinero(m.ganancia)} · {m.unidades} {m.unidades === 1 ? "camiseta" : "camisetas"}
        </p>
      </div>

      <div className="relative h-40">
        {/* Líneas guía */}
        {[1, 0.5, 0].map((f) => (
          <div key={f} className="absolute inset-x-0 flex items-center gap-1" style={{ bottom: `${f * 100}%`, transform: "translateY(50%)" }}>
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="w-10 text-right text-[11px] tabular-nums text-zinc-400">
              {f === 0 ? "$0" : "$" + Math.round(max * f).toLocaleString("en-US")}
            </span>
          </div>
        ))}
        {/* Columnas */}
        <div className="absolute inset-y-0 left-0 right-11 flex items-end gap-[2px]">
          {meses.map((x, i) => (
            <button
              key={x.clave}
              type="button"
              onClick={() => setSel(i)}
              aria-label={`${MESES_LARGOS[Number(x.clave.slice(5)) - 1]}: ${formatoDinero(x.ventas)}`}
              aria-pressed={i === sel}
              className="flex h-full flex-1 items-end justify-center rounded-md px-[2px] active:bg-zinc-100"
            >
              <span
                className={"animate-crecer-y block w-full max-w-6 origin-bottom rounded-t-[4px] transition-colors " + (i === sel ? "bg-emerald-700" : "bg-emerald-400")}
                style={{ height: x.ventas > 0 ? `max(${(x.ventas / max) * 100}%, 3px)` : 0, animationDelay: `${i * 35}ms` }}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="mr-11 mt-1 flex gap-[2px]">
        {meses.map((x, i) => (
          <span key={x.clave} className={"flex-1 text-center text-[11px] " + (i === sel ? "font-semibold text-zinc-900" : "text-zinc-500")}>
            {MESES_CORTOS[Number(x.clave.slice(5)) - 1]}
          </span>
        ))}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-zinc-500">Ver como tabla</summary>
        <table className="mt-2 w-full tabular-nums">
          <thead>
            <tr className="text-left text-zinc-500">
              <th className="py-1 font-medium">Mes</th>
              <th className="py-1 text-right font-medium">Ventas</th>
              <th className="py-1 text-right font-medium">Ganancia</th>
              <th className="py-1 text-right font-medium">Unid.</th>
            </tr>
          </thead>
          <tbody>
            {[...meses].reverse().map((x) => (
              <tr key={x.clave} className="border-t border-zinc-100">
                <td className="py-1">{MESES_CORTOS[Number(x.clave.slice(5)) - 1]} {x.clave.slice(0, 4)}</td>
                <td className="py-1 text-right">{formatoDinero(x.ventas)}</td>
                <td className="py-1 text-right">{formatoDinero(x.ganancia)}</td>
                <td className="py-1 text-right">{x.unidades}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
