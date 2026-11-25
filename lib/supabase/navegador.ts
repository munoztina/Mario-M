import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el navegador. Solo se usa para SUBIR archivos
 * directo a Supabase (las fotos del celular pesan más de lo que acepta Vercel).
 * Usa la misma sesión (cookies) que el resto de la app.
 */
export function crearClienteNavegador() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
