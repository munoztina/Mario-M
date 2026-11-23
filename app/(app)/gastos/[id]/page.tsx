import { notFound } from "next/navigation";
import { Encabezado } from "@/components/estructura";
import { BotonBorrar } from "@/components/campos";
import { crearClienteSupabase } from "@/lib/supabase/server";
import { hoyEcuador } from "@/lib/formato";
import type { Gasto } from "@/lib/datos";
import { FormularioGasto } from "../FormularioGasto";
import { borrarGasto } from "../acciones";

export default async function EditarGasto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteSupabase();
  const { data: gasto } = await supabase.from("gastos").select("*").eq("id", id).maybeSingle();
  if (!gasto) notFound();
  return (
    <>
      <Encabezado titulo="Editar gasto" volver="/gastos" />
      <FormularioGasto gasto={gasto as Gasto} hoy={hoyEcuador()} />
      <form action={borrarGasto.bind(null, id)} className="mt-6">
        <BotonBorrar pregunta="¿Borrar este gasto?" />
      </form>
    </>
  );
}
