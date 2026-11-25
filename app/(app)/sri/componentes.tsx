"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { BotonGuardar, Campo, Formulario, MensajeError, Opciones, claseInput } from "@/components/campos";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { TIPOS_COMPROBANTE } from "@/lib/datos";
import { hoyEcuador } from "@/lib/formato";
import type { TipoDeclaracion } from "@/lib/sri";
import { marcarDeclarada, registrarComprobante } from "./acciones";

/** Botón "Ya declaré": se abre un formulario corto con la fecha y lo que pagaste. */
export function MarcarDeclarada({ tipo, periodo, sugerido }: { tipo: TipoDeclaracion; periodo: string; sugerido?: number }) {
  const [estado, accion, pendiente] = useActionState(marcarDeclarada.bind(null, tipo, periodo), undefined);
  return (
    <details className="group mt-3">
      <summary className="tocable flex h-12 cursor-pointer list-none items-center justify-center rounded-2xl bg-emerald-600 text-base font-semibold text-white active:bg-emerald-700 group-open:hidden">
        ✓ Ya declaré
      </summary>
      <Formulario accion={accion} pendiente={pendiente} className="space-y-3 rounded-xl border border-zinc-200 p-3">
        <Campo etiqueta="¿Qué día declaraste?">
          <input name="presentada_el" type="date" defaultValue={hoyEcuador()} max={hoyEcuador()} required className={claseInput} />
        </Campo>
        <Campo etiqueta="¿Cuánto pagaste? (USD)" ayuda="Si declaraste en cero, deja 0.">
          <input name="valor_pagado" inputMode="decimal" defaultValue={sugerido ? sugerido.toFixed(2).replace(".", ",") : "0"} className={claseInput} />
        </Campo>
        <Campo etiqueta="Nota (opcional)">
          <input name="notas" placeholder="ej. número de formulario" className={claseInput} />
        </Campo>
        <MensajeError texto={estado?.error} />
        <BotonGuardar texto="Guardar como declarada" />
      </Formulario>
    </details>
  );
}

/** Botón que pide confirmación antes de enviar su formulario. */
export function BotonConfirmar({ pregunta, texto, peligro }: { pregunta: string; texto: string; peligro?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(pregunta)) e.preventDefault();
      }}
      className={"tocable rounded-lg px-2 py-1 text-sm font-medium disabled:opacity-60 " + (peligro ? "text-red-600 active:bg-red-50" : "text-zinc-500 active:bg-zinc-100")}
    >
      {pending ? "…" : texto}
    </button>
  );
}

const EXTENSIONES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};
const MAXIMO_MB = 10;

/** Subir la foto o el PDF de un comprobante (va directo del celular a Supabase). */
export function SubirComprobante() {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();
  const [listo, setListo] = useState(false);
  const [clave, setClave] = useState(0); // para limpiar el formulario después de guardar

  async function guardar(datos: FormData) {
    setError(undefined);
    setListo(false);
    const archivo = datos.get("archivo");
    if (!(archivo instanceof File) || archivo.size === 0) return setError("Elige una foto o un PDF.");
    const ext = EXTENSIONES[archivo.type] ?? (/\.heic$/i.test(archivo.name) ? "heic" : undefined);
    if (!ext) return setError("Solo se aceptan fotos (JPG, PNG, HEIC) o PDF.");
    if (archivo.size > MAXIMO_MB * 1024 * 1024) return setError(`El archivo pesa más de ${MAXIMO_MB} MB. Toma la foto de nuevo o compártela en menor calidad.`);

    setEnviando(true);
    try {
      const fecha = String(datos.get("fecha") ?? "");
      const ruta = `${fecha.slice(0, 4) || hoyEcuador().slice(0, 4)}/${crypto.randomUUID()}.${ext}`;
      const supabase = crearClienteNavegador();
      const { error: errorSubida } = await supabase.storage
        .from("comprobantes")
        .upload(ruta, archivo, { contentType: archivo.type || (ext === "heic" ? "image/heic" : undefined) });
      if (errorSubida) return setError("No se pudo subir el archivo: " + errorSubida.message);

      const r = await registrarComprobante({
        fecha,
        tipo: String(datos.get("tipo") ?? ""),
        descripcion: String(datos.get("descripcion") ?? ""),
        archivo: ruta,
        nombre_archivo: archivo.name,
      });
      if (r?.error) return setError(r.error);
      setListo(true);
      setClave((n) => n + 1);
      setAbierto(false);
    } catch {
      setError("No se pudo subir. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto) {
    return (
      <div>
        {listo && <p className="mb-2 text-sm text-green-700">✓ Comprobante guardado.</p>}
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="tocable h-12 w-full rounded-2xl border border-zinc-300 text-base font-semibold text-zinc-900 active:bg-zinc-100"
        >
          + Subir comprobante
        </button>
      </div>
    );
  }

  return (
    <Formulario key={clave} accion={guardar} pendiente={enviando} className="space-y-3 rounded-xl border border-zinc-200 p-3">
      <Campo etiqueta="Foto o PDF">
        <input
          name="archivo"
          type="file"
          accept="image/*,application/pdf,.heic"
          required
          className="block w-full text-sm text-zinc-600 file:mr-3 file:h-11 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-4 file:font-medium file:text-zinc-900"
        />
      </Campo>
      <Campo etiqueta="¿Qué es?">
        <Opciones nombre="tipo" opciones={TIPOS_COMPROBANTE} valor="Factura de compra" columnas={2} />
      </Campo>
      <Campo etiqueta="Descripción">
        <input name="descripcion" required placeholder="ej. Factura Geomil lote 1" className={claseInput} />
      </Campo>
      <Campo etiqueta="Fecha del comprobante">
        <input name="fecha" type="date" defaultValue={hoyEcuador()} required className={claseInput} />
      </Campo>
      <MensajeError texto={error} />
      <BotonGuardar texto={enviando ? "Subiendo…" : "Guardar comprobante"} />
      <button type="button" onClick={() => setAbierto(false)} className="h-11 w-full rounded-xl text-sm text-zinc-500 active:bg-zinc-100">
        Cancelar
      </button>
    </Formulario>
  );
}
