/**
 * @arquivo vite.config.ts
 * @descricao Configuracao do Vite com React e TailwindCSS
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao — AceleradoraECO
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH || "/",
});
