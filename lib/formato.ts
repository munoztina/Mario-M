const dinero = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** 1234.5 -> "$1,234.50" */
export function formatoDinero(valor: number | string | null | undefined) {
  return dinero.format(Number(valor ?? 0));
}

/** "2026-11-23" -> "23/11/2026" */
export function formatoFecha(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

/** "2026-11-23" -> "Noviembre 2026" */
export function nombreMes(iso: string) {
  const [a, m] = iso.split("-");
  return `${MESES[Number(m) - 1]} ${a}`;
}

/** Fecha de hoy en Ecuador como "aaaa-mm-dd". */
export function hoyEcuador() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" }).format(new Date());
}

/**
 * Convierte lo que escribe el usuario en número.
 * Acepta "12.50", "12,50", "$12", "1,234.50" y "1.234,50".
 * Devuelve null si no es un número válido.
 */
export function leerMonto(texto: FormDataEntryValue | null): number | null {
  let s = String(texto ?? "").replace(/[$\s]/g, "");
  if (!s) return null;
  const ultimaComa = s.lastIndexOf(",");
  const ultimoPunto = s.lastIndexOf(".");
  if (ultimaComa > ultimoPunto) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Math.round(Number(s) * 100) / 100;
}

/** Limpia espacios: "  barcelona   sc " -> "barcelona sc" */
export function limpiarTexto(texto: FormDataEntryValue | null) {
  return String(texto ?? "").trim().replace(/\s+/g, " ");
}
