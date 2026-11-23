"use client";

import { useActionState, useMemo, useState } from "react";
import { guardarLote } from "./acciones";
import { BotonGuardar, Campo, CampoGrupo, Formulario, MensajeError, Opciones, PieFormulario, claseInput } from "@/components/campos";
import { ESTADOS_LOTE, METODOS_ENVIO, PROVEEDORES, TALLAS, type Lote, type LoteItem, type Modelo } from "@/lib/datos";
import { ENVIO_MIAMI, GEOMIL, calcularLote, precioSugerido } from "@/lib/costos";
import { formatoDinero, leerMonto } from "@/lib/formato";

type Fila = { clave: number; modelo_id: string; equipo: string; talla: string; cantidad: string; precio_unitario: string; extras: string };

type Props = {
  lote?: Lote;
  items?: LoteItem[];
  modelos: Modelo[];
  equipos: string[];
  cupoRestante: number;
  hoy: string;
};

const claseChica = "h-11 w-full rounded-lg border border-zinc-300 bg-white px-2 text-base focus:border-emerald-600 focus:outline-none";
let contador = 0;

export function FormularioLote({ lote, items, modelos, equipos, cupoRestante, hoy }: Props) {
  const [estado, accion, pendiente] = useActionState(guardarLote.bind(null, lote?.id ?? null), undefined);

  const [metodo, setMetodo] = useState(lote?.metodo_envio ?? "UPS/FedEx");
  const [descuento, setDescuento] = useState(lote ? String(lote.descuento) : "0");
  const [domicilio, setDomicilio] = useState(lote?.entrega_domicilio ?? false);
  const [filas, setFilas] = useState<Fila[]>(
    items?.length
      ? items.map((i) => ({
          clave: contador++,
          modelo_id: i.modelo_id,
          equipo: i.equipo,
          talla: i.talla,
          cantidad: String(i.cantidad),
          precio_unitario: String(i.precio_unitario),
          extras: String(i.extras),
        }))
      : [{ clave: contador++, modelo_id: "", equipo: "", talla: "M", cantidad: "1", precio_unitario: "", extras: "0" }],
  );

  const modelo = (id: string) => modelos.find((m) => m.id === id);
  const num = (s: string) => leerMonto(s) ?? 0;
  const itemsCalc = filas.map((f) => ({
    cantidad: Math.max(0, Math.trunc(Number(f.cantidad) || 0)),
    precio_unitario: num(f.precio_unitario),
    extras: num(f.extras),
    peso_lb: Number(modelo(f.modelo_id)?.peso_lb ?? 0),
  }));

  // Valores reales (vacío = usar el cálculo). Al editar, solo se muestran si difieren del cálculo.
  const base = useMemo(
    () => calcularLote({ items: itemsCalc, descuento: num(descuento), metodo, domicilio }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const inicial = (guardado: number | null | undefined, calculado: number) =>
    lote && guardado != null && Math.abs(Number(guardado) - calculado) > 0.009 ? String(guardado) : "";
  const [reales, setReales] = useState({
    costo_proveedor: inicial(lote?.costo_proveedor, base.proveedorCalc),
    costo_envio_miami: inicial(lote?.costo_envio_miami, base.envioCalc),
    peso_lb: inicial(lote?.peso_lb, base.pesoCalc),
    costo_geomil: inicial(lote?.costo_geomil, base.geomilCalc),
  });

  const c = calcularLote({
    items: itemsCalc,
    descuento: num(descuento),
    metodo,
    domicilio,
    costoProveedor: leerMonto(reales.costo_proveedor),
    envioMiami: leerMonto(reales.costo_envio_miami),
    peso: leerMonto(reales.peso_lb),
    geomil: leerMonto(reales.costo_geomil),
  });
  const avisos = [...c.avisos];
  if (c.proveedor > cupoRestante) avisos.push(`Te quedan ${formatoDinero(cupoRestante)} de cupo 4x4 este año y este lote vale ${formatoDinero(c.proveedor)}.`);

  function cambiar(clave: number, cambio: Partial<Fila>) {
    setFilas((fs) =>
      fs.map((f) => {
        if (f.clave !== clave) return f;
        const nueva = { ...f, ...cambio };
        // Al cambiar modelo o talla, proponer el precio del proveedor.
        if ("modelo_id" in cambio || "talla" in cambio) {
          const m = modelo(nueva.modelo_id);
          if (m) nueva.precio_unitario = String(precioSugerido(Number(m.precio_proveedor), nueva.talla));
        }
        return nueva;
      }),
    );
  }

  const fila = (etiqueta: string, valor: string, detalle?: string) => (
    <div className="flex justify-between gap-3 py-1">
      <span className="text-zinc-600">
        {etiqueta}
        {detalle && <span className="block text-xs text-zinc-400">{detalle}</span>}
      </span>
      <span className="font-medium tabular-nums">{valor}</span>
    </div>
  );

  return (
    <Formulario accion={accion} pendiente={pendiente} className="space-y-5">
      <CampoGrupo etiqueta="Proveedor">
        <Opciones nombre="proveedor" opciones={PROVEEDORES} valor={lote?.proveedor ?? "SoccerPlus"} columnas={2} />
      </CampoGrupo>

      <CampoGrupo etiqueta="Envío China → Miami">
        <Opciones nombre="metodo_envio" opciones={METODOS_ENVIO} valor={metodo} onCambio={setMetodo} columnas={3} />
        <p className="mt-1 text-xs text-zinc-500">{ENVIO_MIAMI[metodo]?.nota}</p>
      </CampoGrupo>

      {/* ---------- Camisetas ---------- */}
      <CampoGrupo etiqueta="Camisetas del lote">
        <div className="space-y-3">
          {filas.map((f, n) => (
            <div key={f.clave} className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-700">Fila {n + 1}</span>
                <span className="flex items-center gap-2">
                  {c.costos[n] > 0 && <span className="text-sm text-zinc-600">costo c/u <strong className="text-zinc-900">{formatoDinero(c.costos[n])}</strong></span>}
                  {filas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setFilas((fs) => fs.filter((x) => x.clave !== f.clave))}
                      className="h-9 w-9 rounded-full text-lg text-zinc-400 active:bg-zinc-100"
                      aria-label={`Quitar fila ${n + 1}`}
                    >
                      ✕
                    </button>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="Modelo"
                  value={f.modelo_id}
                  onChange={(e) => cambiar(f.clave, { modelo_id: e.target.value })}
                  className={claseChica + " col-span-2"}
                >
                  <option value="" disabled>Modelo…</option>
                  {modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
                <input
                  aria-label="Equipo"
                  list="lista-equipos"
                  value={f.equipo}
                  onChange={(e) => cambiar(f.clave, { equipo: e.target.value })}
                  placeholder="Equipo, ej. Real Madrid 26/27 local"
                  autoCapitalize="words"
                  className={claseChica + " col-span-2"}
                />
                <label className="text-xs text-zinc-500">
                  Talla
                  <select value={f.talla} onChange={(e) => cambiar(f.clave, { talla: e.target.value })} className={claseChica}>
                    {TALLAS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="text-xs text-zinc-500">
                  Cantidad
                  <input type="number" inputMode="numeric" min={1} value={f.cantidad} onChange={(e) => cambiar(f.clave, { cantidad: e.target.value })} className={claseChica} />
                </label>
                <label className="text-xs text-zinc-500">
                  Precio proveedor ($)
                  <input inputMode="decimal" value={f.precio_unitario} onChange={(e) => cambiar(f.clave, { precio_unitario: e.target.value })} className={claseChica} />
                </label>
                <label className="text-xs text-zinc-500">
                  Extras c/u ($)
                  <input inputMode="decimal" value={f.extras} onChange={(e) => cambiar(f.clave, { extras: e.target.value })} className={claseChica} />
                </label>
              </div>
            </div>
          ))}
          <datalist id="lista-equipos">
            {equipos.map((e) => <option key={e} value={e} />)}
          </datalist>
          <button
            type="button"
            onClick={() => {
              const ultima = filas[filas.length - 1];
              setFilas((fs) => [
                ...fs,
                { clave: contador++, modelo_id: ultima?.modelo_id ?? "", equipo: "", talla: "M", cantidad: "1", precio_unitario: ultima?.precio_unitario ?? "", extras: "0" },
              ]);
            }}
            className="h-12 w-full rounded-2xl border-2 border-dashed border-zinc-300 font-medium text-zinc-600 active:bg-zinc-100"
          >
            + Agregar otra camiseta
          </button>
          <p className="text-xs text-zinc-500">Extras: nombre y número estrella $2 · personalizado $3 · parche $1 · retro con nombre +$3.</p>
        </div>
      </CampoGrupo>

      <Campo etiqueta="Descuento del proveedor (%)" ayuda="SoccerPlus da 2–5% desde 5 unidades.">
        <input name="descuento" inputMode="decimal" value={descuento} onChange={(e) => setDescuento(e.target.value)} className={claseInput} />
      </Campo>

      {/* ---------- Resumen de costos ---------- */}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm">
        <h3 className="mb-2 font-semibold text-zinc-900">Costo del lote</h3>
        {fila("Proveedor", formatoDinero(c.proveedor), reales.costo_proveedor ? "valor real" : num(descuento) ? `con ${num(descuento)}% de descuento` : undefined)}
        {fila("Envío a Miami", formatoDinero(c.envio), reales.costo_envio_miami ? "valor real" : metodo)}
        {fila(
          "Geomil",
          formatoDinero(c.geomil),
          reales.costo_geomil
            ? "valor real"
            : `${c.libras} lb × $${GEOMIL.porLibra} + IVA + $${GEOMIL.arancel + GEOMIL.fodinfa} arancel/FODINFA${domicilio ? " + domicilio" : ""}`,
        )}
        <div className="mt-1 border-t border-emerald-200 pt-2">
          {fila("Total", formatoDinero(c.total))}
          {fila(`Promedio por camiseta (${c.unidades})`, formatoDinero(c.promedio))}
          {fila("Peso", `${c.peso} lb`, reales.peso_lb ? "peso real" : "estimado por modelo")}
        </div>
        {avisos.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {avisos.map((a) => (
              <li key={a} className="flex gap-2 rounded-lg bg-amber-50 px-2 py-1.5 text-zinc-800 ring-1 ring-amber-300">
                <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fab219] text-xs text-black">⚠</span>
                {a}
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="rounded-2xl border border-zinc-200 bg-white p-4" open={Object.values(reales).some(Boolean)}>
        <summary className="cursor-pointer font-medium text-zinc-800">Valores reales (cuando los tengas)</summary>
        <p className="mt-1 text-xs text-zinc-500">Déjalos vacíos para usar el cálculo. Si escribes el valor real, el costo de cada camiseta se ajusta.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {([
            ["costo_proveedor", "Pagado por PayPal ($)", c.proveedorCalc],
            ["costo_envio_miami", "Envío a Miami ($)", c.envioCalc],
            ["peso_lb", "Peso real (lb)", c.pesoCalc],
            ["costo_geomil", "Cobro Geomil ($)", c.geomilCalc],
          ] as const).map(([k, etiqueta, calc]) => (
            <label key={k} className="text-xs text-zinc-500">
              {etiqueta}
              <input
                name={k}
                inputMode="decimal"
                value={reales[k]}
                onChange={(e) => setReales((r) => ({ ...r, [k]: e.target.value }))}
                placeholder={`auto: ${calc}`}
                className={claseChica}
              />
            </label>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="entrega_domicilio" checked={domicilio} onChange={(e) => setDomicilio(e.target.checked)} className="h-5 w-5 accent-emerald-600" />
          Entrega a domicilio de Geomil (+${GEOMIL.domicilio})
        </label>
      </details>

      <CampoGrupo etiqueta="Estado">
        <Opciones nombre="estado" opciones={ESTADOS_LOTE} valor={lote?.estado && lote.estado !== "Recibido" ? lote.estado : "Pedido"} columnas={3} />
        <p className="mt-1 text-xs text-zinc-500">Cuando llegue, usa el botón «Recibir en Quito» del lote.</p>
      </CampoGrupo>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Fecha del pedido">
          <input name="fecha_pedido" type="date" defaultValue={lote?.fecha_pedido ?? hoy} required className={claseInput} />
        </Campo>
        <Campo etiqueta="Guía (opcional)">
          <input name="guia" defaultValue={lote?.guia ?? ""} autoCapitalize="characters" placeholder="Nº de seguimiento" className={claseInput} />
        </Campo>
      </div>

      <Campo etiqueta="Notas (opcional)">
        <textarea name="notas" defaultValue={lote?.notas ?? ""} rows={2} className={claseInput + " h-auto py-2.5"} />
      </Campo>

      <input
        type="hidden"
        name="items"
        value={JSON.stringify(filas.map(({ clave: _clave, ...f }) => ({ ...f, cantidad: Number(f.cantidad), precio_unitario: num(f.precio_unitario), extras: num(f.extras) })))}
      />
      <MensajeError texto={estado?.error} />
      <PieFormulario>
        <BotonGuardar texto={lote ? "Guardar cambios" : `Registrar lote (${c.unidades} camisetas)`} />
      </PieFormulario>
    </Formulario>
  );
}
