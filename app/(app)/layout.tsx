import { redirect } from "next/navigation";
import { MenuInferior } from "@/components/MenuInferior";
import { crearClienteSupabase } from "@/lib/supabase/server";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  // Segunda puerta: además de tener sesión, el correo debe estar en "usuarios_permitidos".
  const supabase = await crearClienteSupabase();
  const { data: permitido } = await supabase.rpc("es_permitido");
  if (permitido !== true) redirect("/sin-acceso");

  return (
    <>
      <main className="mx-auto max-w-lg px-4 pb-40">{children}</main>
      <MenuInferior />
    </>
  );
}
