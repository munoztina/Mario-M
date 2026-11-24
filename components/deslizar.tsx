"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type Resultado = { error?: string } | void;
type Accion = () => Promise<Resultado>;

type Aviso = { clave: number; texto: string; deshacer?: () => void; error?: boolean };

type Contexto = {
  ocultos: Set<string>;
  borrar: (id: string, texto: string, accion: Accion) => void;
  accionRapida: (texto: string, accion: Accion, deshacer: Accion) => void;
};

const Ctx = createContext<Contexto | null>(null);

const ESPERA_MS = 5000;

/**
 * Envuelve una lista. Lleva el control de lo que se borró deslizando y muestra
 * el aviso con «Deshacer». El borrado real se hace a los 5 s (o al salir de la pantalla).
 */
export function ListaConDeshacer({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ocultos, setOcultos] = useState<Set<string>>(new Set());
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const pendiente = useRef<{ id: string; accion: Accion; timer: ReturnType<typeof setTimeout> } | null>(null);

  const mostrar = useCallback((a: Omit<Aviso, "clave">) => setAviso({ ...a, clave: Date.now() }), []);

  const ejecutar = useCallback(
    async (p: { id: string; accion: Accion; timer: ReturnType<typeof setTimeout> }) => {
      clearTimeout(p.timer);
      if (pendiente.current === p) pendiente.current = null;
      const r = await p.accion();
      if (r && r.error) {
        setOcultos((s) => {
          const n = new Set(s);
          n.delete(p.id);
          return n;
        });
        mostrar({ texto: r.error, error: true });
      } else {
        router.refresh();
      }
    },
    [router, mostrar],
  );

  const borrar = useCallback(
    (id: string, texto: string, accion: Accion) => {
      if (pendiente.current) ejecutar(pendiente.current); // termina el borrado anterior
      setOcultos((s) => new Set(s).add(id));
      const p = {
        id,
        accion,
        timer: setTimeout(() => {
          setAviso(null);
          ejecutar(p);
        }, ESPERA_MS),
      };
      pendiente.current = p;
      mostrar({
        texto,
        deshacer: () => {
          clearTimeout(p.timer);
          pendiente.current = null;
          setOcultos((s) => {
            const n = new Set(s);
            n.delete(id);
            return n;
          });
          setAviso(null);
        },
      });
    },
    [ejecutar, mostrar],
  );

  const accionRapida = useCallback(
    async (texto: string, accion: Accion, deshacer: Accion) => {
      const r = await accion();
      if (r && r.error) return mostrar({ texto: r.error, error: true });
      router.refresh();
      mostrar({
        texto,
        deshacer: async () => {
          setAviso(null);
          const d = await deshacer();
          if (d && d.error) mostrar({ texto: d.error, error: true });
          router.refresh();
        },
      });
    },
    [router, mostrar],
  );

  // Si sales de la pantalla o cierras la app, el borrado pendiente se hace ya.
  useEffect(() => {
    const terminar = () => {
      const p = pendiente.current;
      if (!p) return;
      pendiente.current = null;
      clearTimeout(p.timer);
      void p.accion();
    };
    window.addEventListener("pagehide", terminar);
    return () => {
      window.removeEventListener("pagehide", terminar);
      terminar();
    };
  }, []);

  // El aviso de error o de acción rápida se cierra solo.
  useEffect(() => {
    if (!aviso || pendiente.current) return;
    const t = setTimeout(() => setAviso(null), ESPERA_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  return (
    <Ctx.Provider value={{ ocultos, borrar, accionRapida }}>
      {children}
      {aviso && (
        <div
          key={aviso.clave}
          role="status"
          className="animate-aviso fixed inset-x-4 bottom-[calc(9.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md overflow-hidden rounded-2xl bg-zinc-900 text-white shadow-2xl"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <span className={"flex-1 text-sm font-medium " + (aviso.error ? "text-red-700" : "")}>{aviso.texto}</span>
            {aviso.deshacer && (
              <button type="button" onClick={aviso.deshacer} className="rounded-lg px-3 py-1.5 text-sm font-bold uppercase tracking-wide underline-offset-2 active:bg-zinc-700/20">
                Deshacer
              </button>
            )}
          </div>
          <div className="animate-vaciar h-1 origin-left bg-zinc-500" />
        </div>
      )}
    </Ctx.Provider>
  );
}

type Props = {
  id: string;
  /** Texto del aviso y acción del servidor que borra. */
  alBorrar: { texto: string; accion: Accion };
  /** Acción opcional al deslizar a la derecha (ej. marcar entregado). */
  alDerecha?: { etiqueta: string; texto: string; accion: Accion; deshacer: Accion };
  className?: string;
  children: ReactNode;
};

const UMBRAL = 90;

/** Tarjeta que se puede deslizar: ← borrar, → acción rápida. */
export function Deslizable({ id, alBorrar, alDerecha, className = "rounded-2xl", children }: Props) {
  const ctx = useContext(Ctx);
  const [x, setX] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const inicio = useRef<{ x: number; y: number; dir: "h" | "v" | null } | null>(null);
  const movio = useRef(false);
  const caja = useRef<HTMLDivElement>(null);

  if (!ctx) throw new Error("Deslizable debe ir dentro de ListaConDeshacer");
  if (ctx.ocultos.has(id)) return null;

  function soltar() {
    setArrastrando(false);
    if (x <= -UMBRAL) {
      setSaliendo(true);
      setX(-(caja.current?.offsetWidth ?? 400));
      setTimeout(() => {
        ctx!.borrar(id, alBorrar.texto, alBorrar.accion);
        setSaliendo(false);
        setX(0);
      }, 180);
    } else if (x >= UMBRAL && alDerecha) {
      setX(0);
      ctx!.accionRapida(alDerecha.texto, alDerecha.accion, alDerecha.deshacer);
    } else {
      setX(0);
    }
    inicio.current = null;
  }

  const avance = Math.min(Math.abs(x) / UMBRAL, 1);

  return (
    <div ref={caja} className={"relative overflow-hidden " + className}>
      {/* Fondo que aparece al deslizar */}
      {x < 0 && (
        <div className="absolute inset-0 flex items-center justify-end bg-[#d03b3b] pr-5 text-black" aria-hidden>
          <span className="flex items-center gap-2 text-sm font-bold" style={{ opacity: 0.4 + avance * 0.6, transform: `scale(${0.85 + avance * 0.15})` }}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
            </svg>
            Borrar
          </span>
        </div>
      )}
      {x > 0 && alDerecha && (
        <div className="absolute inset-0 flex items-center bg-[#0ca30c] pl-5 text-black" aria-hidden>
          <span className="flex items-center gap-2 text-sm font-bold" style={{ opacity: 0.4 + avance * 0.6, transform: `scale(${0.85 + avance * 0.15})` }}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 5 5 9-10" />
            </svg>
            {alDerecha.etiqueta}
          </span>
        </div>
      )}

      <div
        className="relative touch-pan-y select-none [-webkit-touch-callout:none] [&_a]:[-webkit-user-drag:none]"
        style={{ transform: x ? `translateX(${x}px)` : undefined, transition: arrastrando ? "none" : "transform 0.2s ease-out", opacity: saliendo ? 0.6 : 1 }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button, input, select, textarea")) return;
          inicio.current = { x: e.clientX, y: e.clientY, dir: null };
          movio.current = false;
        }}
        onPointerMove={(e) => {
          const i = inicio.current;
          if (!i) return;
          const dx = e.clientX - i.x;
          const dy = e.clientY - i.y;
          if (!i.dir) {
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
              i.dir = "h";
              e.currentTarget.setPointerCapture(e.pointerId);
              setArrastrando(true);
            } else if (Math.abs(dy) > 8) {
              i.dir = "v";
            }
          }
          if (i.dir !== "h") return;
          movio.current = true;
          // A la derecha solo si hay acción; con resistencia al pasar el umbral.
          let v = dx > 0 && !alDerecha ? dx * 0.15 : dx;
          if (Math.abs(v) > UMBRAL) v = Math.sign(v) * (UMBRAL + (Math.abs(v) - UMBRAL) * 0.4);
          setX(v);
        }}
        onPointerUp={() => (inicio.current?.dir === "h" ? soltar() : (inicio.current = null))}
        onPointerCancel={() => {
          inicio.current = null;
          setArrastrando(false);
          setX(0);
        }}
        onDragStartCapture={(e) => e.preventDefault()}
        onClickCapture={(e) => {
          // Si fue un deslizamiento, no abrir la tarjeta.
          if (movio.current) {
            e.preventDefault();
            e.stopPropagation();
            movio.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Texto de ayuda para descubrir el gesto. */
export function AyudaDeslizar({ derecha }: { derecha?: string }) {
  return (
    <p className="mb-2 text-center text-xs text-zinc-400">
      ← Desliza para borrar{derecha ? ` · Desliza → para ${derecha}` : ""}
    </p>
  );
}
