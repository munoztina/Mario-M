// Fechas de declaración del SRI para RIMPE – Emprendedor (persona natural).
// IVA: cada semestre (enero–junio se declara en julio; julio–diciembre, en enero).
// Renta: una vez al año, en marzo del año siguiente.
// El día depende del noveno dígito del RUC; si cae sábado o domingo pasa al lunes.
// (Los feriados no se calculan: si el día es feriado, el plazo es el siguiente día hábil.)

/** Noveno dígito del RUC de Mario. */
export const NOVENO_DIGITO_RUC = 0;

/** Día de vencimiento según el noveno dígito (calendario del SRI). */
const DIA_POR_DIGITO: Record<number, number> = { 1: 10, 2: 12, 3: 14, 4: 16, 5: 18, 6: 20, 7: 22, 8: 24, 9: 26, 0: 28 };

/** La app sigue las obligaciones desde el relanzamiento (2.º semestre de 2026). */
export const SRI_DESDE = "2026-07-01";

/** Avisos: amarillo cuando faltan menos de estos días, rojo cuando faltan menos de 5. */
export const SRI_AVISO_DIAS = 15;
export const SRI_URGENTE_DIAS = 5;

export type TipoDeclaracion = "IVA" | "Renta";

export type Obligacion = {
  tipo: TipoDeclaracion;
  periodo: string; // "2026-S2" o "2026"
  nombre: string; // "IVA · julio a diciembre 2026"
  desde: string; // inicio del período que se declara
  hasta: string; // fin del período
  vence: string; // fecha límite
};

const iso = (a: number, m: number, d: number) => new Date(Date.UTC(a, m - 1, d)).toISOString().slice(0, 10);

/** Fecha límite en ese mes; si cae en fin de semana, pasa al lunes. */
export function vencimiento(anio: number, mes: number, digito = NOVENO_DIGITO_RUC) {
  const f = new Date(Date.UTC(anio, mes - 1, DIA_POR_DIGITO[digito]));
  const diaSemana = f.getUTCDay(); // 0 domingo, 6 sábado
  if (diaSemana === 6) f.setUTCDate(f.getUTCDate() + 2);
  if (diaSemana === 0) f.setUTCDate(f.getUTCDate() + 1);
  return f.toISOString().slice(0, 10);
}

/** Todas las obligaciones de los años indicados, ordenadas por fecha límite. */
export function obligaciones(anioDesde: number, anioHasta: number): Obligacion[] {
  const lista: Obligacion[] = [];
  for (let a = anioDesde; a <= anioHasta; a++) {
    lista.push(
      { tipo: "IVA", periodo: `${a}-S1`, nombre: `IVA · enero a junio ${a}`, desde: iso(a, 1, 1), hasta: iso(a, 6, 30), vence: vencimiento(a, 7) },
      { tipo: "IVA", periodo: `${a}-S2`, nombre: `IVA · julio a diciembre ${a}`, desde: iso(a, 7, 1), hasta: iso(a, 12, 31), vence: vencimiento(a + 1, 1) },
      { tipo: "Renta", periodo: `${a}`, nombre: `Impuesto a la renta ${a}`, desde: iso(a, 1, 1), hasta: iso(a, 12, 31), vence: vencimiento(a + 1, 3) },
    );
  }
  return lista.filter((o) => o.hasta >= SRI_DESDE).sort((x, y) => x.vence.localeCompare(y.vence));
}

/** Días desde hoy hasta la fecha (negativo si ya pasó). */
export function diasHasta(fecha: string, hoy: string) {
  return Math.round((Date.parse(fecha) - Date.parse(hoy)) / 86_400_000);
}

export type Urgencia = "lista" | "normal" | "pronto" | "urgente";

export function urgencia(dias: number, presentada: boolean): Urgencia {
  if (presentada) return "lista";
  if (dias < SRI_URGENTE_DIAS) return "urgente";
  if (dias < SRI_AVISO_DIAS) return "pronto";
  return "normal";
}

/** "faltan 3 días" / "es hoy" / "venció hace 2 días" */
export function textoDias(dias: number) {
  if (dias === 0) return "vence hoy";
  if (dias === 1) return "vence mañana";
  if (dias > 1) return `faltan ${dias} días`;
  return `venció hace ${-dias} ${dias === -1 ? "día" : "días"}`;
}

/** Clave única de una obligación (igual que en la tabla declaraciones). */
export const claveObligacion = (o: { tipo: string; periodo: string }) => `${o.tipo}|${o.periodo}`;

/**
 * Obligaciones para mostrar: las que vencen hasta ~13 meses desde hoy
 * y la primera pendiente (la que hay que atender ya).
 */
export function obligacionesVisibles(hoy: string, presentadas: Set<string>) {
  const anio = Number(hoy.slice(0, 4));
  const limite = iso(anio + 1, Number(hoy.slice(5, 7)) + 1, 1);
  const lista = obligaciones(Number(SRI_DESDE.slice(0, 4)), anio + 1).filter((o) => o.vence <= limite);
  const proxima = lista.find((o) => !presentadas.has(claveObligacion(o))) ?? null;
  return { lista, proxima };
}
