"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Íconos de línea blanca, en el estilo del logo de FutAddicts. */
const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ICONOS: Record<string, ReactNode> = {
  panel: (
    <svg viewBox="0 0 24 24" {...trazo}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  pedidos: (
    <svg viewBox="0 0 24 24" {...trazo}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  ),
  inventario: (
    <svg viewBox="0 0 24 24" {...trazo}>
      <path d="M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3c0 2-1.8 3.2-4 3.2S8 5 8 3z" />
    </svg>
  ),
  lotes: (
    <svg viewBox="0 0 24 24" {...trazo}>
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" />
      <path d="M3 7.5 12 12l9-4.5M12 12v9M7.5 5.2l9 4.5" />
    </svg>
  ),
  gastos: (
    <svg viewBox="0 0 24 24" {...trazo}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M16 15h2" />
      <path d="M6 6V5a2 2 0 0 1 2-2h8" />
    </svg>
  ),
};

const SECCIONES = [
  { href: "/", texto: "Panel", icono: "panel" },
  { href: "/pedidos", texto: "Pedidos", icono: "pedidos" },
  { href: "/inventario", texto: "Inventario", icono: "inventario" },
  { href: "/lotes", texto: "Lotes", icono: "lotes" },
  { href: "/gastos", texto: "Gastos", icono: "gastos" },
];

export function MenuInferior() {
  const ruta = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-zinc-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {SECCIONES.map((s) => {
          const activo = s.href === "/" ? ruta === "/" : ruta.startsWith(s.href) || (s.href === "/inventario" && ruta.startsWith("/modelos"));
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={activo ? "page" : undefined}
                className={
                  "relative flex h-[4.5rem] flex-col items-center justify-center gap-1 text-[11px] font-medium " +
                  (activo ? "text-zinc-900" : "text-zinc-400")
                }
              >
                {activo && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-zinc-900" />}
                <span className="h-6 w-6">{ICONOS[s.icono]}</span>
                {s.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
