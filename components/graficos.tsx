"use client";

import Link from "next/link";
import { useState } from "react";
import { formatoDinero } from "@/lib/formato";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

type Mes = { clave: string; ventas: number; ganancia: number; unidades: number; operativos: number };

// Dos tonos de la misma escala (validados para fondo oscuro): la ganancia es parte de las ventas.
const COLOR_VENTAS = "#6f7884";
const COLOR_GANANCIA = "#f5f6f7";

/** Escala "bonita" para el eje: 0, 250, 500… */
function redondo(v: number) {
  if (v <= 0) return 0;
  const pot = 10 ** Math.floor(Math.log10(v));
  for (const f of [1, 2, 2.5, 5, 10]) if (f * pot >= v) return f * pot;
  return 10 * pot;
}

const corto = (n: number) => (Math.abs(n) >= 1000 ? `$${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k` : `$${Math.round(n)}`);

/**
 * Ventas y ganancia de los últimos 12 meses. Cada mes es una barra gris (ventas)
 * con la ganancia en blanco por dentro. Tocar un mes muestra su detalle arriba.
 */
export function GraficoVentasGanancia({ meses, seleccionado }: { meses: Mes[]; seleccionado: string }) {
  const inicial = Math.max(meses.findIndex((m) => m.clave === seleccionado), 0);
  const [sel, setSel] = useState(inicial);

  const max = redondo(Math.max(...meses.map((m) => Math.max(m.ventas, m.ganancia)), 1));
  const minG = Math.min(...meses.map((m) => m.ganancia), 0);
  const min = minG < 0 ? -redondo(-minG) : 0;
  const rango = max - min || 1;
  const y = (v: number) => ((v - min) / rango) * 100; // % desde abajo
  const cero = y(0);

  const m = meses[sel];
  const [a, mm] = m.clave.split("-").map(Number);
  const guias = [max, max / 2, 0, ...(min < 0 ? [min] : [])];

  return (
    <div>
      {/* Detalle del mes tocado */}
      <div className="mb-3 min-h-[5.5rem]" aria-live="polite">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm capitalize text-zinc-500">
            {MESES_LARGOS[mm - 1]} {a}
          </p>
          {m.clave !== seleccionado && (
            <Link href={`/?mes=${m.clave}`} className="text-sm font-medium text-emerald-700">
              Ver este mes ›
            </Link>
          )}
        </div>
        <p className="text-lg font-semibold text-zinc-900">
          {formatoDinero(m.ventas)} <span className="text-sm font-normal text-zinc-500">en ventas</span>
        </p>
        <p className="text-sm text-zinc-600">
          Ganancia <strong className={m.ganancia < 0 ? "text-red-700" : "text-zinc-900"}>{formatoDinero(m.ganancia)}</strong> · {m.unidades}{" "}
          {m.unidades === 1 ? "camiseta" : "camisetas"}
        </p>
      </div>

      {/* Leyenda */}
      <div className="mb-2 flex gap-4 text-xs text-zinc-600">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: COLOR_VENTAS }} /> Ventas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: COLOR_GANANCIA }} /> Ganancia
        </span>
      </div>

      <div className="relative h-44">
        {guias.map((g) => (
          <div key={g} className="absolute inset-x-0 flex items-center gap-1" style={{ bottom: `${y(g)}%`, transform: "translateY(50%)" }}>
            <div className={"h-px flex-1 " + (g === 0 ? "bg-zinc-400" : "bg-zinc-200")} />
            <span className="w-10 text-right text-[11px] tabular-nums text-zinc-400">{corto(g)}</span>
          </div>
        ))}
        <div className="absolute inset-y-0 left-0 right-11 flex gap-[2px]">
          {meses.map((x, i) => {
            const nombre = MESES_LARGOS[Number(x.clave.slice(5)) - 1];
            const altoV = x.ventas > 0 ? Math.max(y(x.ventas) - cero, 1) : 0;
            const altoG = Math.abs(y(x.ganancia) - cero);
            return (
              <button
                key={x.clave}
                type="button"
                onClick={() => setSel(i)}
                aria-label={`${nombre}: ventas ${formatoDinero(x.ventas)}, ganancia ${formatoDinero(x.ganancia)}`}
                aria-pressed={i === sel}
                className={"relative h-full flex-1 rounded-md " + (i === sel ? "bg-zinc-100" : "active:bg-zinc-100")}
              >
                {/* ventas */}
                <span
                  className="animate-crecer-y absolute left-1/2 w-[70%] max-w-6 -translate-x-1/2 origin-bottom rounded-t-[4px]"
                  style={{ bottom: `${cero}%`, height: `${altoV}%`, background: COLOR_VENTAS, animationDelay: `${i * 35}ms` }}
                />
                {/* ganancia (por dentro; hacia abajo si es negativa) */}
                {x.ganancia !== 0 && (
                  <span
                    className={"animate-crecer-y absolute left-1/2 w-[34%] max-w-3 -translate-x-1/2 " + (x.ganancia > 0 ? "origin-bottom rounded-t-[3px]" : "origin-top rounded-b-[3px]")}
                    style={{
                      ...(x.ganancia > 0 ? { bottom: `${cero}%` } : { top: `${100 - cero}%` }),
                      height: `${Math.max(altoG, 1)}%`,
                      background: COLOR_GANANCIA,
                      animationDelay: `${i * 35 + 120}ms`,
                    }}
                  />
                )}
              </button>
            );
          })}
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
                <td className="py-1">
                  <Link href={`/?mes=${x.clave}`} className="underline-offset-2 hover:underline">
                    {MESES_CORTOS[Number(x.clave.slice(5)) - 1]} {x.clave.slice(0, 4)}
                  </Link>
                </td>
                <td className="py-1 text-right">{formatoDinero(x.ventas)}</td>
                <td className={"py-1 text-right " + (x.ganancia < 0 ? "text-red-700" : "")}>{formatoDinero(x.ganancia)}</td>
                <td className="py-1 text-right">{x.unidades}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
