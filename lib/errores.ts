/** Traduce errores de la base de datos a mensajes claros en español. */
export function mensajeError(error: { message?: string; hint?: string | null; code?: string } | null) {
  if (!error) return "Ocurrió un error. Intenta de nuevo.";
  if (error.hint === "sin_stock" && error.message) {
    return error.message + ". Revisa el inventario o marca el pedido como «Por encargo».";
  }
  const m = error.message ?? "";
  if (m.includes("anticipo_no_mayor_al_precio")) return "El anticipo no puede ser mayor que el precio.";
  if (error.code === "23505") return "Ese registro ya existe.";
  if (error.code === "23503") return "El modelo elegido no existe en «costos_modelo».";
  if (error.code === "23514") return "Algún dato no es válido. Revisa los campos.";
  if (error.code === "42501" || m.includes("JWT")) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  return "No se pudo guardar: " + m;
}
