import { connection } from "next/server";
import { Encabezado } from "@/components/estructura";
import { hoyEcuador } from "@/lib/formato";
import { FormularioGasto } from "../FormularioGasto";

export default async function NuevoGasto() {
  await connection(); // calcular "hoy" en cada visita, no al compilar
  return (
    <>
      <Encabezado titulo="Nuevo gasto" volver="/gastos" />
      <FormularioGasto hoy={hoyEcuador()} />
    </>
  );
}
