import { Encabezado } from "@/components/estructura";
import { hoyEcuador } from "@/lib/formato";
import { FormularioLote } from "../FormularioLote";
import { cargarOpcionesLote } from "../cargarOpciones";

export default async function NuevoLote() {
  const opciones = await cargarOpcionesLote();
  return (
    <>
      <Encabezado titulo="Nuevo lote" volver="/lotes" />
      <FormularioLote hoy={hoyEcuador()} {...opciones} />
    </>
  );
}
