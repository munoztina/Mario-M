"use client";

import { useActionState } from "react";
import { guardarInventario } from "./acciones";
import { BotonGuardar, Formulario, Campo, CampoGrupo, Contador, MensajeError, Opciones, PieFormulario, claseInput } from "@/components/campos";
import { TALLAS, type ItemInventario } from "@/lib/datos";

export function FormularioInventario({ item, modelos, equipos }: { item?: ItemInventario; modelos: string[]; equipos: string[] }) {
  const [estado, accion, pendiente] = useActionState(guardarInventario.bind(null, item?.id ?? null), undefined);
  return (
    <Formulario accion={accion} pendiente={pendiente} className="space-y-5">
      <Campo etiqueta="Modelo">
        <select name="modelo" defaultValue={item?.modelo ?? ""} required className={claseInput}>
          <option value="" disabled>Elige el modelo…</option>
          {modelos.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </Campo>
      <Campo etiqueta="Equipo" ayuda="Escríbelo siempre igual para que coincida con los pedidos.">
        <input
          name="equipo"
          list="lista-equipos"
          defaultValue={item?.equipo}
          required
          autoComplete="off"
          autoCapitalize="words"
          placeholder="Ej.: Ecuador 2026 local"
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
        {!item && (
          <p className="mt-1 text-xs text-zinc-500">Si ya tenías esta camiseta en el inventario, se suma a la cantidad que había.</p>
        )}
      </CampoGrupo>
      <MensajeError texto={estado?.error} />
      <PieFormulario>
        <BotonGuardar texto={item ? "Guardar cambios" : "Agregar al inventario"} />
      </PieFormulario>
    </Formulario>
  );
}
