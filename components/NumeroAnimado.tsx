"use client";

import { useEffect, useState } from "react";

const dinero = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Número que sube contando desde 0 al aparecer. */
export function NumeroAnimado({ valor, tipo = "entero", sufijo = "" }: { valor: number; tipo?: "dinero" | "entero"; sufijo?: string }) {
  const [actual, setActual] = useState(valor);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || valor === 0) {
      setActual(valor);
      return;
    }
    const duracion = 700;
    const t0 = performance.now();
    let id = 0;
    const paso = (t: number) => {
      const p = Math.min((t - t0) / duracion, 1);
      const suave = 1 - Math.pow(1 - p, 3); // empieza rápido y frena al final
      setActual(valor * suave);
      if (p < 1) id = requestAnimationFrame(paso);
    };
    setActual(0);
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [valor]);

  const texto = tipo === "dinero" ? dinero.format(actual) : Math.round(actual).toLocaleString("en-US");
  return (
    <span className="tabular-nums" aria-label={(tipo === "dinero" ? dinero.format(valor) : String(valor)) + sufijo}>
      {texto}
      {sufijo}
    </span>
  );
}
