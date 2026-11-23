"use client";

import { useActionState, useState } from "react";
import { guardarInventario } from "./acciones";
import { BotonGuardar, Formulario, Campo, CampoGrupo, Contador, MensajeError, Opciones, PieFormulario, claseInput } from "@/components/campos";
import { TALLAS, type ItemInventario, type Modelo } from "@/lib/datos";

export function FormularioInventario({ item, modelos, equipos }: { item?: ItemInventario; modelos: Modelo[]; equipos: string[] }) {
  const [estado, accion, pendiente] = useActionState(guardarInventario.bind(null, item?.id ?? null), undefined);
  const [modeloId, setModeloId] = useState(item?.modelo_id ?? "");
  const [costo, setCosto] = useState(item ? String(item.costo_unitario) : "");

  return (
    <Formulario accion={accion} pendiente={pendiente} className="space-y-5">
      <Campo etiqueta="Modelo">
        <select
          name="modelo_id"
          value={modeloId}
          onChange={(e) => {
            setModeloId(e.target.value);
            // Proponer el costo estimado del modelo mientras no haya lotes.
            const m = modelos.find((x) => x.id === e.target.value);
            if (!item && m) setCosto(String(m.costo_estimado));
          }}
          required
          className={claseInput}
        >
          <option value="" disabled>Elige el modelo…</option>
          {modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </Campo>
      <Campo etiqueta="Equipo" ayuda="Escríbelo siempre igual, ej.: Real Madrid 26/27 local.">
        <input
          name="equipo"
          list="lista-equipos"
          defaultValue={item?.equipo}
          required
          autoComplete="off"
          autoCapitalize="words"
          className={claseInput}
        />
        <datalist id="lista-equipos">
          {equipos.map((e) => <option key={e} value={e} />)}
        </datalist>
      </Campo>
      <CampoGrupo etiqueta="Talla">
        <Opciones nombre="talla" opciones={TALLAS} valor={item?.talla ?? ""} />
      </CampoGrupo>
      <CampoGrupo etiqueta={item ? "Cantidad en stock" : "¿Cuántas llegaron?"}>
        <Contador nombre="cantidad" valor={item?.cantidad ?? 1} />
        {!item && <p className="mt-1 text-xs text-zinc-500">Si ya tenías esta camiseta, se suma a la cantidad que había.</p>}
      </CampoGrupo>
      <Campo
        etiqueta="Costo por camiseta ($)"
        ayuda="Puesta en Quito (proveedor + envíos + Geomil). Se propone el costo estimado del modelo."
      >
        <input
          name="costo_unitario"
          inputMode="decimal"
          value={costo}
          onChange={(e) => setCosto(e.target.value)}
          required
          placeholder="0.00"
          className={claseInput}
        />
      </Campo>
      <MensajeError texto={estado?.error} />
      <PieFormulario>
        <BotonGuardar texto={item ? "Guardar cambios" : "Agregar al inventario"} />
      </PieFormulario>
    </Formulario>
  );
}
