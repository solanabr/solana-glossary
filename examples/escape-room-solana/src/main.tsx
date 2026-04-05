/**
 * @arquivo main.tsx
 * @descricao Ponto de entrada da aplicacao — monta providers e renderiza App
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { WalletProvider } from "./lib/wallet";
import "./lib/i18n";
import "./index.css";
import App from "./App";

// ─── Renderizacao ───────────────────────────────────────────────────────────

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || "/"}>
      <WalletProvider>
        <App />
      </WalletProvider>
    </BrowserRouter>
  </StrictMode>,
);
