import { cerrarSesion } from "@/app/login/acciones";

export default function SinAcceso() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 text-center">
      <p className="mb-3 text-5xl">🔒</p>
      <h1 className="mb-2 text-xl font-bold">No tienes acceso</h1>
      <p className="mb-6 text-zinc-600">Esta cuenta no está autorizada para usar el panel. Pide acceso al dueño del negocio.</p>
      <form action={cerrarSesion}>
        <button className="h-12 w-full rounded-2xl bg-zinc-900 font-semibold text-white">Cerrar sesión</button>
      </form>
    </main>
  );
}
