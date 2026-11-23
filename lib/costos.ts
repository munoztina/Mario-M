// Cálculo del costo de cada camiseta de un lote (fórmula del CLAUDE.md).
// Archivo sin dependencias para poder usarlo en el formulario y en el servidor.

export const GEOMIL = {
  porLibra: 4.99,
  iva: 0.15,
  arancel: 20,
  fodinfa: 1,
  domicilio: 3.85,
};

/** Régimen courier 4x4: límites por paquete. */
export const LIMITE_PAQUETE = { libras: 8, valor: 400 };

/** Envío China → Miami por unidad, y mínimo de unidades (según SoccerPlus). */
export const ENVIO_MIAMI: Record<string, { porUnidad: number; minimo: number; nota: string }> = {
  USPS: { porUnidad: 0, minimo: 6, nota: "gratis desde 6 unidades (15–20 días)" },
  "UPS/FedEx": { porUnidad: 2, minimo: 10, nota: "$2 por unidad, mínimo 10 (7–13 días)" },
  "SZ-FedEx": { porUnidad: 3, minimo: 10, nota: "$3 por unidad, mínimo 10 (5–8 días)" },
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Precio del proveedor sugerido para una talla (recargos de tallas grandes y niño). */
export function precioSugerido(precioModelo: number, talla: string) {
  if (talla === "Niño") return 14;
  if (talla === "2XL") return precioModelo + 1;
  if (talla === "3XL") return precioModelo + 2;
  return precioModelo;
}

/** Costo Geomil de un paquete: libras (hacia arriba, mínimo 1) × 4,99 + IVA, + arancel + FODINFA (+ domicilio). */
export function costoGeomil(peso: number, domicilio: boolean) {
  const libras = Math.max(1, Math.ceil(peso - 1e-9));
  const flete = libras * GEOMIL.porLibra * (1 + GEOMIL.iva);
  return { libras, flete: r2(flete), total: r2(flete + GEOMIL.arancel + GEOMIL.fodinfa + (domicilio ? GEOMIL.domicilio : 0)) };
}

type Item = { cantidad: number; precio_unitario: number; extras: number; peso_lb: number };

export type Entrada = {
  items: Item[];
  descuento: number; // %
  metodo: string;
  domicilio: boolean;
  // Valores reales: si se escriben, reemplazan al cálculo.
  costoProveedor?: number | null;
  envioMiami?: number | null;
  peso?: number | null;
  geomil?: number | null;
};

export function calcularLote(e: Entrada) {
  const unidades = e.items.reduce((s, i) => s + i.cantidad, 0);
  const factorDesc = 1 - (e.descuento || 0) / 100;

  const proveedorCalc = r2(e.items.reduce((s, i) => s + (i.precio_unitario + i.extras) * i.cantidad * factorDesc, 0));
  const proveedor = e.costoProveedor ?? proveedorCalc;

  const regla = ENVIO_MIAMI[e.metodo] ?? ENVIO_MIAMI["UPS/FedEx"];
  const envioCalc = r2(regla.porUnidad * unidades);
  const envio = e.envioMiami ?? envioCalc;

  const pesoCalc = r2(e.items.reduce((s, i) => s + i.peso_lb * i.cantidad, 0));
  const peso = e.peso ?? pesoCalc;
  const geo = costoGeomil(peso, e.domicilio);
  const geomil = e.geomil ?? geo.total;

  // Si lo pagado por PayPal difiere del cálculo, la diferencia se reparte en proporción.
  const ajusteProveedor = proveedorCalc > 0 ? proveedor / proveedorCalc : 0;

  // Geomil se reparte según el peso de cada camiseta; el envío a Miami, por unidad.
  const costos = e.items.map((i) => {
    const parteGeomil = pesoCalc > 0 ? geomil * (i.peso_lb / pesoCalc) : unidades ? geomil / unidades : 0;
    return r2((i.precio_unitario + i.extras) * factorDesc * ajusteProveedor + (unidades ? envio / unidades : 0) + parteGeomil);
  });

  const total = r2(proveedor + envio + geomil);
  const avisos: string[] = [];
  if (unidades > 0 && unidades < regla.minimo && regla.porUnidad > 0) avisos.push(`${e.metodo} pide mínimo ${regla.minimo} unidades.`);
  if (e.metodo === "USPS" && unidades > 0 && unidades < regla.minimo) avisos.push("USPS es gratis solo desde 6 unidades: revisa el costo del envío.");
  if (peso > LIMITE_PAQUETE.libras) avisos.push(`Pesa ${peso} lb: pasa el límite de ${LIMITE_PAQUETE.libras} lb por paquete 4x4.`);
  if (proveedor > LIMITE_PAQUETE.valor) avisos.push(`Vale $${proveedor.toFixed(2)}: pasa el límite de $${LIMITE_PAQUETE.valor} por paquete 4x4.`);

  return {
    unidades,
    proveedorCalc,
    proveedor,
    envioCalc,
    envio,
    pesoCalc,
    peso,
    libras: geo.libras,
    geomilCalc: geo.total,
    geomil,
    total,
    promedio: unidades ? r2(total / unidades) : 0,
    costos,
    avisos,
  };
}
