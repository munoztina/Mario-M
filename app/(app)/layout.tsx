import { MenuInferior } from "@/components/MenuInferior";

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto max-w-lg px-4 pb-40">{children}</main>
      <MenuInferior />
    </>
  );
}
