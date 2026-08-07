import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  build: {
    // The glossary corpus and pt/es locale packs are large by nature and are
    // deliberately code-split (below) into cache-stable, on-demand chunks. App
    // code stays tiny, so raise the limit past the data chunks to keep the
    // warning meaningful for genuine app-bundle regressions.
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Animation library — heavy, used by a handful of components.
          if (
            /[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(
              id,
            )
          ) {
            return "framer-motion";
          }
          // React runtime + router + query: stable across app deploys.
          if (
            /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(
              id,
            ) ||
            id.includes("@remix-run/router") ||
            id.includes("@tanstack/react-query") ||
            id.includes("@tanstack/query-core")
          ) {
            return "react-vendor";
          }
          // English glossary corpus (SDK dist JS). The data/i18n/*.json locale
          // packs are dynamically imported and intentionally left out so they
          // stay as separate on-demand chunks.
          if (
            /[\\/](node_modules[\\/]@stbr[\\/]solana-glossary|packages[\\/]glossary)[\\/]dist[\\/]/.test(
              id,
            )
          ) {
            return "glossary-data";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-force-graph-2d"],
  },
});
