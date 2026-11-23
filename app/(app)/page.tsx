import { redirect } from "next/navigation";

// El panel con números vendrá después; por ahora el inicio son los pedidos.
export default function Inicio() {
  redirect("/pedidos");
}
