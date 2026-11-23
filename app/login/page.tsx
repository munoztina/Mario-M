"use client";

import { useActionState } from "react";
import { iniciarSesion } from "./acciones";
import { BotonGuardar, Formulario, Campo, MensajeError, claseInput } from "@/components/campos";

export default function Login() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, undefined);
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <img src="/logo-futaddicts.png" alt="FutAddicts" className="mx-auto mb-4 h-36 w-36" />
        <h1 className="font-marca text-2xl font-bold tracking-[0.2em]">FUTADDICTS</h1>
        <p className="mt-1 text-zinc-500">Panel del negocio · Inicia sesión</p>
      </div>
      <Formulario accion={accion} pendiente={pendiente} className="space-y-4">
        <Campo etiqueta="Correo">
          <input name="email" type="email" autoComplete="email" required className={claseInput} />
        </Campo>
        <Campo etiqueta="Contraseña">
          <input name="password" type="password" autoComplete="current-password" required className={claseInput} />
        </Campo>
        <MensajeError texto={estado?.error} />
        <BotonGuardar texto="Entrar" />
      </Formulario>
    </main>
  );
}
