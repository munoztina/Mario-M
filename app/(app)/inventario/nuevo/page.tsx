import { Encabezado } from "@/components/estructura";
import { FormularioInventario } from "../FormularioInventario";
import { cargarOpcionesInventario } from "../cargarOpciones";

export default async function NuevoInventario() {
  const opciones = await cargarOpcionesInventario();
  return (
    <>
      <Encabezado titulo="Agregar camisetas" volver="/inventario" />
      <FormularioInventario {...opciones} />
    </>
  );
}
