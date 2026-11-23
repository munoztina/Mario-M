import Link from "next/link";
import type { ReactNode } from "react";

export function Encabezado({ titulo, volver, accion }: { titulo: string; volver?: string; accion?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 -mx-4 mb-4 flex h-14 items-center gap-2 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur">
      {volver && (
        <Link href={volver} className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-2xl text-zinc-600 active:bg-zinc-100" aria-label="Volver">
          ‹
        </Link>
      )}
      <h1 className="font-marca flex-1 truncate text-[15px] font-bold uppercase tracking-wider">{titulo}</h1>
      {accion}
    </header>
  );
}

export function BotonNuevo({ href, texto }: { href: string; texto: string }) {
  return (
    <Link
      href={href}
      className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-20 flex h-14 items-center gap-1 rounded-full bg-emerald-600 pl-4 pr-5 text-base font-semibold text-white shadow-lg active:bg-emerald-700"
    >
      <span className="text-2xl leading-none">+</span> {texto}
    </Link>
  );
}

export function Aviso({ ok }: { ok?: string }) {
  if (!ok) return null;
  return (
    <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">{ok}</p>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return <p className="py-12 text-center text-zinc-500">{texto}</p>;
}

export function Tarjeta({ children, href }: { children: ReactNode; href?: string }) {
  const clase = "block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm";
  return href ? (
    <Link href={href} className={clase + " active:bg-zinc-50"}>
      {children}
    </Link>
  ) : (
    <div className={clase}>{children}</div>
  );
}
