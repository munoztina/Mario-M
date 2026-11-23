"use client";

import { useActionState } from "react";
import { recibirLote } from "./acciones";
import { BotonGuardar, Formulario, MensajeError } from "@/components/campos";

type Preventa = { id: string; cliente: string; equipo: string; modelo: string; talla: string; fecha: string };

export function RecibirLote({ loteId, preventas, unidades }: { loteId: string; preventas: Preventa[]; unidades: number }) {
  const [estado, accion, pendiente] = useActionState(recibirLote.bind(null, loteId), undefined);
  return (
    <Formulario accion={accion} pendiente={pendiente} className="space-y-3 rounded-2xl border-2 border-emerald-600 bg-white p-4">
      <h2 className="text-lg font-semibold">📦 Recibir en Quito</h2>
      <p className="text-sm text-zinc-600">
        Las {unidades} camisetas pasan al inventario con su costo calculado y el lote queda como «Recibido».
      </p>
      {preventas.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-zinc-800">Preventas que coinciden con este lote (se les asigna su camiseta):</legend>
          {preventas.map((p) => (
            <label key={p.id} className="flex items-start gap-3 rounded-xl bg-zinc-50 p-3">
              <input type="checkbox" name="preventas" value={p.id} defaultChecked className="mt-0.5 h-5 w-5 accent-emerald-600" />
              <span className="text-sm">
                <strong>{p.cliente}</strong>
                <span className="block text-zinc-600">
                  {p.equipo} · {p.modelo} · {p.talla}
                </span>
              </span>
            </label>
          ))}
          <p className="text-xs text-zinc-500">Esos pedidos toman el costo real del lote y la camiseta se descuenta del inventario.</p>
        </fieldset>
      )}
      <MensajeError texto={estado?.error} />
      <BotonGuardar texto="Recibir en Quito" />
    </Formulario>
  );
}
