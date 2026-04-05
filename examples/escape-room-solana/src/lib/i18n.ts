/**
 * @arquivo i18n.ts
 * @descricao Configuracao do react-i18next com pt-BR e es
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptBR from "../locales/pt-BR.json";
import es from "../locales/es.json";

// ─── Recursos de traducao ────────────────────────────────────────────────────

const resources = {
  "pt-BR": { translation: ptBR },
  es: { translation: es },
};

// ─── Inicializacao ───────────────────────────────────────────────────────────

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "pt-BR",
    interpolation: {
      escapeValue: false, // React ja faz escape
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "lang",
      caches: ["localStorage"],
    },
  });

export default i18n;
