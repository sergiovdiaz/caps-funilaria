import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import svgr from "vite-plugin-svgr";
// import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // <--- alias para src
    },
  },
  server: {
    host: "0.0.0.0", // Aceita conexões externas
    port: 5173, // Porta padrão
    open: true, // Abre automaticamente no navegador
    allowedHosts: [
      "abrga1wl0020352",
      "abrga1dt0061038",
      "abrga1dt0060584",
      "abrga1dt0020581",
      "abrga1dt0021519",
    ],
  },
});
