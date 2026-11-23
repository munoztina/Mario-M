"use client";

import { useActionState, useMemo, useState } from "react";
import { guardarPedido } from "./acciones";
import {
  BotonGuardar, Formulario, Campo, CampoGrupo, MensajeError, Opciones, PieFormulario, claseInput,
} from "@/components/campos";
import { ESTADOS_PEDIDO, TALLAS, type CostoModelo, type ItemInventario, type Pedido } from "@/lib/datos";
import { formatoDinero, leerMonto } from "@/lib/formato";

type Props = {
  pedido?: Pedido;
  hoy: string;
  modelos: CostoModelo[];
  stock: ItemInventario[];
  equipos: string[];
};

const clave = (i: { modelo: string; equipo: string; talla: string }) => `${i.modelo}|${i.equipo}|${i.talla}`;

export function FormularioPedido({ pedido, hoy, modelos, stock, equipos }: Props) {
  const [estado, accion, pendiente] = useActionState(guardarPedido.bind(null, pedido?.id ?? null), undefined);

  // Si editamos un pedido que ya había descontado, esa camiseta está "apartada" para él:
  // la mostramos como disponible aunque el inventario diga 0.
  const disponibles = useMemo(() => {
    const lista = stock.map((i) => ({ ...i }));
    if (pedido?.descontar && pedido.estado !== "Cancelado") {
      const propia = lista.find((i) => clave(i) === clave(pedido));
      if (propia) propia.cantidad += 1;
      else lista.push({ id: -1, modelo: pedido.modelo, equipo: pedido.equipo, talla: pedido.talla, cantidad: 1 });
    }
    return lista.filter((i) => i.cantidad > 0).sort((a, b) => clave(a).localeCompare(clave(b)));
  }, [stock, pedido]);

  const [origen, setOrigen] = useState<"inventario" | "encargo">(
    pedido ? (pedido.descontar ? "inventario" : "encargo") : disponibles.length ? "inventario" : "encargo",
  );
  const [elegido, setElegido] = useState(pedido?.descontar ? clave(pedido) : "");
  const [modelo, setModelo] = useState(pedido?.modelo ?? "");
  const [precio, setPrecio] = useState(pedido ? String(pedido.precio) : "");
  const [anticipo, setAnticipo] = useState(pedido ? String(pedido.anticipo) : "");

  const itemElegido = disponibles.find((i) => clave(i) === elegido);

  // Al elegir modelo, proponer su precio de venta si el campo está vacío.
  function proponerPrecio(m: string | undefined) {
    const sugerido = modelos.find((x) => x.modelo === m)?.precio_venta;
    if (!precio && sugerido && Number(sugerido) > 0) setPrecio(String(sugerido));
  }

  const saldo = (leerMonto(precio) ?? 0) - (leerMonto(anticipo) ?? 0);

  return (
    <Formulario accion={accion} pendiente={pendiente} className="space-y-5">
      <Campo etiqueta="Cliente">
        <input
          name="cliente"
          defaultValue={pedido?.cliente}
          required
          autoComplete="off"
          autoCapitalize="words"
          placeholder="Nombre del cliente"
          className={claseInput}
        />
      </Campo>

      <CampoGrupo etiqueta="¿De dónde sale la camiseta?">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-200 p-1">
          {([
            ["inventario", "La tengo en stock"],
            ["encargo", "Por encargo"],
          ] as const).map(([v, t]) => (
            <label
              key={v}
              className={
                "flex h-11 cursor-pointer items-center justify-center rounded-xl text-sm font-semibold " +
                (origen === v ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600")
              }
            >
              <input type="radio" name="origen" value={v} checked={origen === v} onChange={() => setOrigen(v)} className="sr-only" />
              {t}
            </label>
          ))}
        </div>
      </CampoGrupo>

      {origen === "inventario" ? (
        <Campo
          etiqueta="Camiseta del inventario"
          ayuda={disponibles.length ? "Al guardar se resta 1 del inventario." : "No tienes camisetas en stock. Usa «Por encargo»."}
        >
          <select
            value={elegido}
            onChange={(e) => {
              setElegido(e.target.value);
              proponerPrecio(disponibles.find((i) => clave(i) === e.target.value)?.modelo);
            }}
            required
            className={claseInput}
          >
            <option value="" disabled>Elige una camiseta…</option>
            {disponibles.map((i) => (
              <option key={clave(i)} value={clave(i)}>
                {i.equipo} · {i.modelo} · {i.talla} (quedan {i.cantidad})
              </option>
            ))}
          </select>
          <input type="hidden" name="modelo" value={itemElegido?.modelo ?? ""} />
          <input type="hidden" name="equipo" value={itemElegido?.equipo ?? ""} />
          <input type="hidden" name="talla" value={itemElegido?.talla ?? ""} />
        </Campo>
      ) : (
        <>
          <Campo etiqueta="Modelo">
            <select
              name="modelo"
              value={modelo}
              onChange={(e) => {
                setModelo(e.target.value);
                proponerPrecio(e.target.value);
              }}
              required
              className={claseInput}
            >
              <option value="" disabled>Elige el modelo…</option>
              {modelos.map((m) => (
                <option key={m.modelo} value={m.modelo}>{m.modelo}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Equipo" ayuda="Ej.: Ecuador 2026 local, Barcelona SC, Liga de Quito.">
            <input
              name="equipo"
              list="lista-equipos"
              defaultValue={pedido?.equipo}
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
            <Opciones nombre="talla" opciones={TALLAS} valor={pedido?.talla ?? ""} />
          </CampoGrupo>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Precio ($)">
          <input
            name="precio"
            inputMode="decimal"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
            placeholder="0.00"
            className={claseInput}
          />
        </Campo>
        <Campo etiqueta="Anticipo ($)">
          <input
            name="anticipo"
            inputMode="decimal"
            value={anticipo}
            onChange={(e) => setAnticipo(e.target.value)}
            placeholder="0.00"
            className={claseInput}
          />
        </Campo>
      </div>
      <div className="-mt-2 flex items-center justify-between text-sm">
        <span className="text-zinc-600">
          Saldo por cobrar: <strong className={saldo > 0 ? "text-amber-700" : "text-emerald-700"}>{formatoDinero(Math.max(saldo, 0))}</strong>
        </span>
        <button type="button" onClick={() => setAnticipo(precio)} className="rounded-lg px-2 py-1 font-medium text-emerald-700 active:bg-emerald-50">
          Pagó completo
        </button>
      </div>

      <CampoGrupo etiqueta="Estado">
        <Opciones nombre="estado" opciones={ESTADOS_PEDIDO} valor={pedido?.estado ?? "Por encargo"} columnas={2} />
      </CampoGrupo>

      <Campo etiqueta="Fecha">
        <input name="fecha" type="date" defaultValue={pedido?.fecha ?? hoy} required className={claseInput} />
      </Campo>

      <Campo etiqueta="Notas (opcional)">
        <textarea
          name="notas"
          defaultValue={pedido?.notas ?? ""}
          rows={2}
          placeholder="Nombre y número, parche, teléfono…"
          className={claseInput + " h-auto py-2.5"}
        />
      </Campo>

      <MensajeError texto={estado?.error} />
      <PieFormulario>
        <BotonGuardar texto={pedido ? "Guardar cambios" : "Registrar pedido"} />
      </PieFormulario>
    </Formulario>
  );
}
