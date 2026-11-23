"use client";

import { useActionState } from "react";
import { guardarModelo } from "./acciones";
import { BotonGuardar, Campo, Formulario, MensajeError, claseInput } from "@/components/campos";
import { sinIva, type Modelo } from "@/lib/datos";
import { formatoDinero } from "@/lib/formato";

export function FormularioModelo({ modelo }: { modelo: Modelo }) {
  const [estado, accion, pendiente] = useActionState(guardarModelo.bind(null, modelo.id), undefined);
  const ganancia = sinIva(Number(modelo.precio_venta_sugerido)) - Number(modelo.costo_estimado);
  const campo = (nombre: keyof Modelo, etiqueta: string) => (
    <Campo etiqueta={etiqueta}>
      <input name={nombre} inputMode="decimal" defaultValue={String(modelo[nombre])} required className={claseInput} />
    </Campo>
  );
  return (
    <Formulario accion={accion} pendiente={pendiente} className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="font-semibold">{modelo.nombre}</h2>
        <p className="text-xs text-zinc-500">
          Ganancia aprox. con estos valores: <strong className="text-zinc-700">{formatoDinero(ganancia)}</strong> por camiseta (sin IVA)
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {campo("costo_estimado", "Costo estimado ($)")}
        {campo("precio_venta_sugerido", "Precio sugerido ($)")}
        {campo("precio_proveedor", "Precio proveedor ($)")}
        {campo("peso_lb", "Peso (lb)")}
      </div>
      <MensajeError texto={estado?.error} />
      {estado?.ok && <p className="text-sm text-emerald-700">Guardado ✓</p>}
      <BotonGuardar texto="Guardar" />
    </Formulario>
  );
}
