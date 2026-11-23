import { Encabezado } from "@/components/estructura";
import { hoyEcuador } from "@/lib/formato";
import { FormularioPedido } from "../FormularioPedido";
import { cargarOpcionesPedido } from "../cargarOpciones";

export default async function NuevoPedido() {
  const opciones = await cargarOpcionesPedido();
  return (
    <>
      <Encabezado titulo="Nuevo pedido" volver="/pedidos" />
      <FormularioPedido hoy={hoyEcuador()} {...opciones} />
    </>
  );
}
