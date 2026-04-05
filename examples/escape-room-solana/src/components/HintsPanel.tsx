/**
 * @arquivo HintsPanel.tsx
 * @descricao Painel lateral de dicas — exibe dicas reveladas e bloqueadas
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

import { useTranslation } from "react-i18next";
import type { Hint } from "../hooks/useHints";
import { audioManager } from "../lib/audio";
import type { AudioTheme } from "../lib/audio";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface HintsPanelProps {
  hints: Hint[];
  usedCount: number;
  maxHints: number;
  canUseHint: boolean;
  totalPenalty: number;
  hintPenaltyCost: number;
  disabled: boolean;
  /** Tema sonoro opcional */
  theme?: AudioTheme;
  onUseHint: () => void;
}

// ─── Componente ─────────────────────────────────────────────────────────────

export default function HintsPanel({
  hints,
  usedCount,
  maxHints,
  canUseHint,
  totalPenalty,
  hintPenaltyCost,
  disabled,
  theme,
  onUseHint,
}: HintsPanelProps) {
  const { t } = useTranslation();
  const revealedCount = hints.filter((h) => h.revealed).length;

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          {t("common.hints")} ({usedCount}/{maxHints})
        </h3>

        {/* Lista de slots de dicas */}
        <div className="space-y-3 mb-4">
          {hints.map((hint, i) => (
            <div
              key={i}
              className={`text-xs rounded-lg px-3 py-2 border ${
                hint.revealed
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-200"
                  : "bg-white/5 border-white/5 text-gray-500"
              }`}
            >
              {hint.revealed ? hint.text : t("escape.hintLocked")}
            </div>
          ))}
        </div>

        {/* Botao para usar dica */}
        <button
          onClick={() => {
            onUseHint();
            audioManager.playSfx("hint", theme);
          }}
          disabled={!canUseHint || disabled}
          className={`w-full text-sm font-medium px-4 py-2.5 rounded-xl border transition-all ${
            canUseHint
              ? "bg-purple-600/20 border-purple-500/40 text-purple-300 hover:bg-purple-600/30"
              : "bg-white/5 border-white/5 text-gray-600 cursor-not-allowed"
          }`}
        >
          {canUseHint
            ? t("hints.useHint", { cost: hintPenaltyCost })
            : t("hints.noHints")}
        </button>

        {/* Penalidade acumulada */}
        {revealedCount > 0 && (
          <p className="text-[10px] text-red-400/70 mt-2 text-center">
            {t("hints.penalty", { total: totalPenalty })}
          </p>
        )}
      </div>
    </aside>
  );
}
