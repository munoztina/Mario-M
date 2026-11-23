"use client";

import { useFormStatus } from "react-dom";
import { createContext, startTransition, useContext, useState, type ReactNode } from "react";

const Pendiente = createContext(false);

/**
 * Formulario que NO borra lo escrito si hay un error al guardar
 * (por defecto React 19 limpia el formulario después de enviarlo).
 */
export function Formulario({
  accion,
  pendiente,
  className,
  children,
}: {
  accion: (datos: FormData) => void;
  pendiente: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Pendiente.Provider value={pendiente}>
      <form
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const datos = new FormData(e.currentTarget);
          startTransition(() => accion(datos));
        }}
      >
        {children}
      </form>
    </Pendiente.Provider>
  );
}

export const claseInput =
  "w-full h-12 rounded-xl border border-zinc-300 bg-white px-3 text-base text-zinc-900 " +
  "placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

export function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: ReactNode; ayuda?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-zinc-500">{ayuda}</span>}
    </label>
  );
}

export function CampoGrupo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-zinc-700">{etiqueta}</legend>
      {children}
    </fieldset>
  );
}

/** Botones tipo "chip" para elegir una opción tocando (más cómodo que un menú en el celular). */
export function Opciones({
  nombre,
  opciones,
  valor,
  onCambio,
  columnas = 4,
}: {
  nombre: string;
  opciones: readonly string[];
  valor: string;
  onCambio?: (v: string) => void;
  columnas?: 2 | 3 | 4;
}) {
  const [elegido, setElegido] = useState(valor);
  const cols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[columnas];
  return (
    <div className={`grid ${cols} gap-2`}>
      {opciones.map((op) => (
        <label
          key={op}
          className={
            "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-2 py-2 text-center text-sm font-medium transition " +
            (elegido === op
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-zinc-300 bg-white text-zinc-700 active:bg-zinc-100")
          }
        >
          <input
            type="radio"
            name={nombre}
            value={op}
            checked={elegido === op}
            onChange={() => {
              setElegido(op);
              onCambio?.(op);
            }}
            className="sr-only"
            required
          />
          {op}
        </label>
      ))}
    </div>
  );
}

/** Campo de cantidad con botones − y + grandes. */
export function Contador({ nombre, valor = 1, minimo = 0 }: { nombre: string; valor?: number; minimo?: number }) {
  const [n, setN] = useState(valor);
  const boton = "h-12 w-14 rounded-xl border border-zinc-300 bg-white text-2xl font-semibold text-zinc-700 active:bg-zinc-100";
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={boton} onClick={() => setN((v) => Math.max(minimo, v - 1))} aria-label="Restar uno">
        −
      </button>
      <input
        name={nombre}
        type="number"
        inputMode="numeric"
        min={minimo}
        value={n}
        onChange={(e) => setN(Math.max(minimo, Number(e.target.value) || 0))}
        className={claseInput + " text-center text-lg font-semibold"}
      />
      <button type="button" className={boton} onClick={() => setN((v) => v + 1)} aria-label="Sumar uno">
        +
      </button>
    </div>
  );
}

export function BotonGuardar({ texto = "Guardar" }: { texto?: string }) {
  const enviando = useContext(Pendiente);
  const { pending: estado } = useFormStatus();
  const pending = enviando || estado;
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-14 w-full rounded-2xl bg-emerald-600 text-lg font-semibold text-white shadow-sm active:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? "Guardando…" : texto}
    </button>
  );
}

/** Barra fija abajo con el botón de guardar, siempre al alcance del pulgar. */
export function PieFormulario({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] -mx-4 mt-6 border-t border-zinc-200 bg-zinc-100/95 px-4 py-3 backdrop-blur">
      {children}
    </div>
  );
}

export function MensajeError({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
      {texto}
    </p>
  );
}

/** Botón de borrar que pide confirmación. Debe ir dentro de un <form action={...}>. */
export function BotonBorrar({ pregunta }: { pregunta: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(pregunta)) e.preventDefault();
      }}
      className="h-12 w-full rounded-2xl border border-red-200 bg-white text-base font-medium text-red-600 active:bg-red-50 disabled:opacity-60"
    >
      {pending ? "Borrando…" : "Borrar"}
    </button>
  );
}
