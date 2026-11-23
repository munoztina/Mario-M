"use client";

import { useActionState, useMemo, useState } from "react";
import { guardarPedido } from "./acciones";
import {
  BotonGuardar, Formulario, Campo, CampoGrupo, MensajeError, Opciones, PieFormulario, claseInput,
} from "@/components/campos";
import {
  ENTREGAS, ESTADOS_PEDIDO, TALLAS, sinIva, type Cliente, type ItemInventario, type Modelo, type Pedido,
} from "@/lib/datos";
import { formatoDinero, leerMonto } from "@/lib/formato";

type Props = {
  pedido?: Pedido;
  hoy: string;
  modelos: Modelo[];
  stock: ItemInventario[];
  clientes: Cliente[];
  equipos: string[];
};

export function FormularioPedido({ pedido, hoy, modelos, stock, clientes, equipos }: Props) {
  const [estado, accion, pendiente] = useActionState(guardarPedido.bind(null, pedido?.id ?? null), undefined);

  // Si editamos una venta que ya salió del stock, esa camiseta está "apartada" para este
  // pedido: se muestra como disponible aunque el inventario diga 0.
  const disponibles = useMemo(() => {
    const lista = stock.map((i) => ({ ...i }));
    if (pedido?.inventario_id && pedido.estado !== "Cancelado") {
      const propia = lista.find((i) => i.id === pedido.inventario_id);
      if (propia) propia.cantidad += 1;
    }
    return lista
      .filter((i) => i.cantidad > 0)
      .sort((a, b) => a.equipo.localeCompare(b.equipo, "es") || a.modelo_orden - b.modelo_orden || TALLAS.indexOf(a.talla as never) - TALLAS.indexOf(b.talla as never));
  }, [stock, pedido]);

  const [origen, setOrigen] = useState<"stock" | "preventa">(
    pedido ? (pedido.inventario_id ? "stock" : "preventa") : disponibles.length ? "stock" : "preventa",
  );
  const [inventarioId, setInventarioId] = useState(pedido?.inventario_id ?? "");
  const [modeloId, setModeloId] = useState(pedido?.modelo_id ?? "");
  const [cliente, setCliente] = useState(pedido?.cliente ?? "");
  const [precio, setPrecio] = useState(pedido ? String(pedido.precio_venta) : "");
  const [anticipo, setAnticipo] = useState(pedido ? String(pedido.anticipo) : "");

  const clienteConocido = clientes.find((c) => c.nombre.toLowerCase() === cliente.trim().toLowerCase());
  const item = disponibles.find((i) => i.id === inventarioId);
  const modelo = modelos.find((m) => m.id === (origen === "stock" ? item?.modelo_id : modeloId));

  // Costo que se guardará: el del pedido (si se edita sin cambiar la camiseta), el del stock o el estimado.
  const mismaCamiseta = pedido && (origen === "stock" ? pedido.inventario_id === inventarioId : !pedido.inventario_id && pedido.modelo_id === modeloId);
  const costo = mismaCamiseta ? Number(pedido.costo) : origen === "stock" ? Number(item?.costo_unitario ?? 0) : Number(modelo?.costo_estimado ?? 0);

  function proponerPrecio(m?: Modelo) {
    if (!precio && m && Number(m.precio_venta_sugerido) > 0) setPrecio(String(m.precio_venta_sugerido));
  }

  const precioNum = leerMonto(precio) ?? 0;
  const saldo = precioNum - (leerMonto(anticipo) ?? 0);
  const ganancia = sinIva(precioNum) - costo;

  return (
    <Formulario accion={accion} pendiente={pendiente} className="space-y-5">
      <Campo etiqueta="Cliente">
        <input
          name="cliente"
          list="lista-clientes"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          required
          autoComplete="off"
          autoCapitalize="words"
          placeholder="Nombre del cliente"
          className={claseInput}
        />
        <datalist id="lista-clientes">
          {clientes.map((c) => <option key={c.id} value={c.nombre} />)}
        </datalist>
      </Campo>
      {clienteConocido ? (
        <p className="-mt-3 text-xs text-zinc-500">
          Cliente registrado{clienteConocido.whatsapp ? ` · WhatsApp ${clienteConocido.whatsapp}` : ""}
          {clienteConocido.instagram ? ` · @${clienteConocido.instagram}` : ""}
        </p>
      ) : (
        cliente.trim() && (
          <details className="-mt-2 rounded-xl border border-zinc-200 bg-white p-3" open={!pedido}>
            <summary className="cursor-pointer text-sm font-medium text-zinc-700">Cliente nuevo: datos de contacto (opcional)</summary>
            <div className="mt-3 space-y-3">
              <input name="whatsapp" type="tel" inputMode="tel" placeholder="WhatsApp (ej. 0991234567)" className={claseInput} />
              <input name="instagram" autoCapitalize="none" placeholder="Instagram (sin @)" className={claseInput} />
              <input name="ciudad" autoCapitalize="words" placeholder="Ciudad" className={claseInput} />
            </div>
          </details>
        )
      )}

      <CampoGrupo etiqueta="¿De dónde sale la camiseta?">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-200 p-1">
          {([
            ["stock", "La tengo en stock"],
            ["preventa", "Preventa"],
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

      {origen === "stock" ? (
        <Campo
          etiqueta="Camiseta del inventario"
          ayuda={disponibles.length ? "Al guardar se resta 1 del inventario." : "No tienes camisetas en stock. Usa «Preventa»."}
        >
          <select
            name="inventario_id"
            value={inventarioId}
            onChange={(e) => {
              setInventarioId(e.target.value);
              proponerPrecio(modelos.find((m) => m.id === disponibles.find((i) => i.id === e.target.value)?.modelo_id));
            }}
            required
            className={claseInput}
          >
            <option value="" disabled>Elige una camiseta…</option>
            {disponibles.map((i) => (
              <option key={i.id} value={i.id}>
                {i.equipo} · {i.modelo} · {i.talla} (quedan {i.cantidad})
              </option>
            ))}
          </select>
        </Campo>
      ) : (
        <>
          <Campo etiqueta="Modelo">
            <select
              name="modelo_id"
              value={modeloId}
              onChange={(e) => {
                setModeloId(e.target.value);
                proponerPrecio(modelos.find((m) => m.id === e.target.value));
              }}
              required
              className={claseInput}
            >
              <option value="" disabled>Elige el modelo…</option>
              {modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Equipo" ayuda="Ej.: Real Madrid 26/27 local, Ecuador 2026, Liga de Quito retro 2008.">
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

      <Campo etiqueta="Personalización (opcional)" ayuda="Las camisetas con nombre no tienen cambio de talla.">
        <input
          name="personalizacion"
          defaultValue={pedido?.personalizacion ?? ""}
          autoComplete="off"
          placeholder="Ej.: MARIO 10, parche Champions"
          className={claseInput}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Precio ($, con IVA)">
          <input
            name="precio_venta"
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
      <div className="-mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <span className="text-zinc-600">
          Saldo: <strong className={saldo > 0 ? "text-amber-700" : "text-emerald-700"}>{formatoDinero(Math.max(saldo, 0))}</strong>
        </span>
        <span className="flex gap-1">
          <button type="button" onClick={() => setAnticipo(String(Math.round(precioNum * 50) / 100))} className="rounded-lg px-2 py-1 font-medium text-emerald-700 active:bg-emerald-50">
            50%
          </button>
          <button type="button" onClick={() => setAnticipo(precio)} className="rounded-lg px-2 py-1 font-medium text-emerald-700 active:bg-emerald-50">
            Pagó todo
          </button>
        </span>
      </div>
      {precioNum > 0 && modelo && (
        <p className="-mt-2 rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
          Ganancia aprox.: <strong className={ganancia >= 0 ? "text-emerald-700" : "text-red-700"}>{formatoDinero(ganancia)}</strong>
          <span className="block text-xs text-zinc-500">
            {formatoDinero(sinIva(precioNum))} sin IVA − costo {formatoDinero(costo)}
            {origen === "preventa" && !mismaCamiseta ? " (estimado)" : ""}
          </span>
        </p>
      )}

      <CampoGrupo etiqueta="Estado">
        <Opciones nombre="estado" opciones={ESTADOS_PEDIDO} valor={pedido?.estado ?? "Preventa"} columnas={2} />
      </CampoGrupo>

      <CampoGrupo etiqueta="Entrega">
        <Opciones nombre="entrega" opciones={ENTREGAS} valor={pedido?.entrega ?? "Quito en mano"} columnas={3} />
      </CampoGrupo>

      <Campo etiqueta="Fecha">
        <input name="fecha" type="date" defaultValue={pedido?.fecha ?? hoy} required className={claseInput} />
      </Campo>

      <Campo etiqueta="Notas (opcional)">
        <textarea
          name="notas"
          defaultValue={pedido?.notas ?? ""}
          rows={2}
          placeholder="Dirección de Servientrega, detalles…"
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
