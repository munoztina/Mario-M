import { notFound } from "next/navigation";
import { Encabezado } from "@/components/estructura";
import { BotonBorrar } from "@/components/campos";
import { crearClienteSupabase } from "@/lib/supabase/server";
import type { ItemInventario } from "@/lib/datos";
import { FormularioInventario } from "../FormularioInventario";
import { cargarOpcionesInventario } from "../cargarOpciones";
import { borrarInventario } from "../acciones";

export default async function EditarInventario({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const supabase = await crearClienteSupabase();
  const [{ data: item }, opciones] = await Promise.all([
    supabase.from("inventario").select("*").eq("id", id).maybeSingle(),
    cargarOpcionesInventario(),
  ]);
  if (!item) notFound();
  return (
    <>
      <Encabezado titulo="Editar inventario" volver="/inventario" />
      <FormularioInventario item={item as ItemInventario} {...opciones} />
      <form action={borrarInventario.bind(null, id)} className="mt-6">
        <BotonBorrar pregunta="¿Borrar esta camiseta del inventario?" />
      </form>
    </>
  );
}
