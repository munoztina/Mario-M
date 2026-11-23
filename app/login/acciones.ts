"use server";

import { redirect } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/server";
import type { EstadoFormulario } from "@/lib/datos";

export async function iniciarSesion(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const supabase = await crearClienteSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: "Correo o contraseña incorrectos." };
  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await crearClienteSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
