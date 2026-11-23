"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/", texto: "Panel", icono: "📊" },
  { href: "/pedidos", texto: "Pedidos", icono: "🧾" },
  { href: "/inventario", texto: "Inventario", icono: "👕" },
  { href: "/gastos", texto: "Gastos", icono: "💸" },
];

export function MenuInferior() {
  const ruta = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {SECCIONES.map((s) => {
          const activo = s.href === "/" ? ruta === "/" : ruta.startsWith(s.href);
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                className={
                  "flex h-[4.5rem] flex-col items-center justify-center gap-0.5 text-xs font-medium " +
                  (activo ? "text-emerald-700" : "text-zinc-500")
                }
              >
                <span className={"text-2xl " + (activo ? "" : "opacity-60 grayscale")}>{s.icono}</span>
                {s.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
