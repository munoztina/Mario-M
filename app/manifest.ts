import type { MetadataRoute } from "next";

// Permite "Agregar a la pantalla de inicio" y abrir la app a pantalla completa.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Panel Camisetas",
    short_name: "Camisetas",
    description: "Pedidos, gastos e inventario",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f5",
    theme_color: "#059669",
    lang: "es-EC",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
