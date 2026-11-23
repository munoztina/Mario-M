import type { MetadataRoute } from "next";

// Permite "Agregar a la pantalla de inicio" y abrir la app a pantalla completa.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FutAddicts",
    short_name: "FutAddicts",
    description: "Pedidos, gastos e inventario",
    start_url: "/",
    display: "standalone",
    background_color: "#14191f",
    theme_color: "#14191f",
    lang: "es-EC",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
