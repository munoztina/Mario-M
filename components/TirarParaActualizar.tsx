"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const UMBRAL = 70;

/** Tirar la pantalla hacia abajo (estando arriba del todo) recarga los datos. */
export function TirarParaActualizar() {
  const router = useRouter();
  const [tirado, setTirado] = useState(0);
  const [cargando, iniciar] = useTransition();
  const ref = useRef({ y: 0, x: 0, activo: false, valor: 0 });

  useEffect(() => {
    const r = ref.current;
    const inicio = (e: TouchEvent) => {
      r.activo = window.scrollY <= 0;
      r.y = e.touches[0].clientY;
      r.x = e.touches[0].clientX;
      r.valor = 0;
    };
    const mover = (e: TouchEvent) => {
      if (!r.activo) return;
      const dy = e.touches[0].clientY - r.y;
      const dx = e.touches[0].clientX - r.x;
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || window.scrollY > 0) {
        r.valor = 0;
        setTirado(0);
        return;
      }
      r.valor = Math.min(dy * 0.5, UMBRAL + 30);
      setTirado(r.valor);
    };
    const fin = () => {
      if (r.activo && r.valor >= UMBRAL) iniciar(() => router.refresh());
      r.activo = false;
      r.valor = 0;
      setTirado(0);
    };
    window.addEventListener("touchstart", inicio, { passive: true });
    window.addEventListener("touchmove", mover, { passive: true });
    window.addEventListener("touchend", fin);
    return () => {
      window.removeEventListener("touchstart", inicio);
      window.removeEventListener("touchmove", mover);
      window.removeEventListener("touchend", fin);
    };
  }, [router]);

  const visible = tirado > 4 || cargando;
  const y = cargando ? 56 : tirado;
  const listo = tirado >= UMBRAL;

  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-50 flex justify-center"
      style={{ transform: `translateY(${y - 40}px)`, opacity: visible ? 1 : 0, transition: tirado ? "none" : "transform 0.25s, opacity 0.25s" }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white shadow-lg">
        {cargando ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900" role="status" aria-label="Actualizando" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-zinc-900"
            style={{ transform: `rotate(${listo ? 180 : (tirado / UMBRAL) * 180}deg)`, transition: "transform 0.15s" }}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        )}
      </div>
    </div>
  );
}
