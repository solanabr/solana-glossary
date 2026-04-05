/**
 * @arquivo Layout.tsx
 * @descricao Layout compartilhado com barra superior (nav, idioma, audio, wallet)
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { audioManager } from "../lib/audio";
import { muteBgm } from "../lib/bgm";
import WalletButton from "./WalletButton";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface LayoutProps {
  children: ReactNode;
  /** Esconde o botao voltar (ex: na Home) */
  hideBack?: boolean;
}

// ─── Componente ─────────────────────────────────────────────────────────────

export default function Layout({ children, hideBack = false }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const [muted, setMuted] = useState(audioManager.isMuted());

  /** Alterna idioma entre pt-BR e es */
  const toggleLang = () => {
    const next = i18n.language === "pt-BR" ? "es" : "pt-BR";
    i18n.changeLanguage(next);
  };

  /** Alterna mute global (SFX + BGM) */
  const toggleMute = () => {
    const nowMuted = audioManager.toggleMute();
    muteBgm(nowMuted);
    setMuted(nowMuted);
  };

  return (
    <div
      className="relative min-h-screen font-['Space_Grotesk',sans-serif]"
      onClick={() => audioManager.init()}
      onKeyDown={() => audioManager.init()}
    >
      {/* ── Barra superior ─────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-3 bg-black/40 backdrop-blur-md border-b border-white/10">
        {/* Esquerda: voltar */}
        <div className="w-28">
          {!hideBack && (
            <Link
              to="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              &larr; {t("common.back")}
            </Link>
          )}
        </div>

        {/* Centro: vazio (flexivel) */}
        <div className="flex-1" />

        {/* Direita: controles */}
        <div className="flex items-center gap-3">
          {/* Toggle de idioma */}
          <button
            onClick={toggleLang}
            className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-colors"
          >
            {i18n.language === "pt-BR" ? "ES" : "PT-BR"}
          </button>

          {/* Mute / Unmute */}
          <button
            onClick={toggleMute}
            className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-colors"
            title={muted ? t("common.unmute") : t("common.mute")}
          >
            {muted ? "🔇" : "🔊"}
          </button>

          {/* Wallet Solana */}
          <WalletButton />
        </div>
      </header>

      {/* ── Conteudo principal ──────────────────────────────────────── */}
      <main className="pt-16">{children}</main>
    </div>
  );
}
