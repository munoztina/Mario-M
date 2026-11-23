"use client";

import { useActionState } from "react";
import { guardarGasto } from "./acciones";
import { BotonGuardar, Formulario, Campo, CampoGrupo, MensajeError, Opciones, PieFormulario, claseInput } from "@/components/campos";
import { CATEGORIAS_GASTO, type Gasto } from "@/lib/datos";

export function FormularioGasto({ gasto, hoy }: { gasto?: Gasto; hoy: string }) {
  const [estado, accion, pendiente] = useActionState(guardarGasto.bind(null, gasto?.id ?? null), undefined);
  return (
    <Formulario accion={accion} pendiente={pendiente} className="space-y-5">
      <Campo etiqueta="Monto ($)">
        <input
          name="monto"
          inputMode="decimal"
          defaultValue={gasto?.monto}
          required
          placeholder="0.00"
          className={claseInput + " h-14 text-2xl font-semibold"}
        />
      </Campo>
      <Campo etiqueta="Concepto">
        <input
          name="concepto"
          defaultValue={gasto?.concepto}
          required
          autoComplete="off"
          placeholder="Ej.: Geomil paquete 12 camisetas"
          className={claseInput}
        />
      </Campo>
      <CampoGrupo etiqueta="Categoría">
        <Opciones nombre="categoria" opciones={CATEGORIAS_GASTO} valor={gasto?.categoria ?? ""} columnas={2} />
      </CampoGrupo>
      <Campo etiqueta="Fecha">
        <input name="fecha" type="date" defaultValue={gasto?.fecha ?? hoy} required className={claseInput} />
      </Campo>
      <MensajeError texto={estado?.error} />
      <PieFormulario>
        <BotonGuardar texto={gasto ? "Guardar cambios" : "Registrar gasto"} />
      </PieFormulario>
    </Formulario>
  );
}
