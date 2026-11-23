import { notFound } from "next/navigation";
import { Encabezado } from "@/components/estructura";
import { BotonBorrar } from "@/components/campos";
import { crearClienteSupabase } from "@/lib/supabase/server";
import { hoyEcuador } from "@/lib/formato";
import type { Pedido } from "@/lib/datos";
import { FormularioPedido } from "../FormularioPedido";
import { cargarOpcionesPedido } from "../cargarOpciones";
import { borrarPedido } from "../acciones";

export default async function EditarPedido({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const supabase = await crearClienteSupabase();
  const [{ data: pedido }, opciones] = await Promise.all([
    supabase.from("pedidos").select("*").eq("id", id).maybeSingle(),
    cargarOpcionesPedido(),
  ]);
  if (!pedido) notFound();

  return (
    <>
      <Encabezado titulo={`Pedido de ${pedido.cliente}`} volver="/pedidos" />
      <FormularioPedido pedido={pedido as Pedido} hoy={hoyEcuador()} {...opciones} />
      <form action={borrarPedido.bind(null, id)} className="mt-6">
        <BotonBorrar
          pregunta={
            pedido.descontar && pedido.estado !== "Cancelado"
              ? "¿Borrar este pedido? La camiseta vuelve al inventario."
              : "¿Borrar este pedido?"
          }
        />
      </form>
    </>
  );
}
