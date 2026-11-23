import { Encabezado } from "@/components/estructura";
import { crearClienteSupabase } from "@/lib/supabase/server";
import type { Modelo } from "@/lib/datos";
import { FormularioModelo } from "./FormularioModelo";

export default async function Modelos() {
  const supabase = await crearClienteSupabase();
  const { data } = await supabase.from("modelos").select("*").order("orden");
  return (
    <>
      <Encabezado titulo="Modelos y costos" volver="/inventario" />
      <p className="mb-4 text-sm text-zinc-600">
        El <strong>costo estimado</strong> se usa en las preventas y al agregar inventario. Cámbialo cuando confirmes precios con
        los proveedores. Los pedidos ya registrados <strong>conservan</strong> su costo.
      </p>
      <div className="space-y-3">
        {((data ?? []) as Modelo[]).map((m) => (
          <FormularioModelo key={m.id} modelo={m} />
        ))}
      </div>
    </>
  );
}
