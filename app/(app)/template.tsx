// Se vuelve a montar en cada cambio de pantalla: la página entra con un deslizamiento suave.
export default function Transicion({ children }: { children: React.ReactNode }) {
  return <div className="animate-entrada">{children}</div>;
}
