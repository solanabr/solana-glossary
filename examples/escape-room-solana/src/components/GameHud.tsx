/**
 * @arquivo GameHud.tsx
 * @descricao Barra HUD do jogo — timer, pontuacao, progresso e controles
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface TimerInfo {
  /** Formato mm:ss */
  display: string;
  /** Porcentagem restante (0-100) */
  percent: number;
  /** Tempo esgotou? */
  isExpired: boolean;
}

interface GameHudProps {
  timer: TimerInfo;
  score: number;
  theme: string;
  level: string;
  station: number;
  totalStations: number;
  onPause: () => void;
  /** Modo do puzzle — batch esconde dots de progresso */
  puzzleMode?: "per-term" | "batch";
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Retorna a cor do timer baseado na porcentagem restante */
function timerColor(percent: number): string {
  if (percent > 50) return "text-emerald-400";
  if (percent > 25) return "text-yellow-400";
  return "text-red-400";
}

/** Retorna a cor da barra de progresso do timer */
function barColor(percent: number): string {
  if (percent > 50) return "bg-emerald-400";
  if (percent > 25) return "bg-yellow-400";
  return "bg-red-400";
}

/** Retorna a cor do glow da barra */
function barGlow(percent: number): string {
  if (percent > 50) return "shadow-emerald-400/40";
  if (percent > 25) return "shadow-yellow-400/40";
  return "shadow-red-400/40";
}

// ─── Componente ─────────────────────────────────────────────────────────────

export default function GameHud({
  timer,
  score,
  theme,
  level,
  station,
  totalStations,
  onPause,
  puzzleMode = "per-term",
}: GameHudProps) {
  const { t } = useTranslation();
  const pulsando = timer.percent < 30 && !timer.isExpired;

  return (
    <div className="sticky top-16 z-40 w-full">
      {/* Fundo glassmorphism */}
      <div className="mx-4 mt-2 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-lg px-5 py-3">
        {/* ── Linha principal: tema | timer | pontuacao ───────────── */}
        <div className="flex items-center justify-between gap-4">
          {/* Lado esquerdo — Tema + nivel */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-medium text-gray-200 truncate font-['Space_Grotesk',sans-serif]">
              {t(`escape.themes.${theme}`)}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider font-semibold whitespace-nowrap">
              {t(`escape.levels.${level}`)}
            </span>
          </div>

          {/* Centro — Timer */}
          <div className="flex flex-col items-center min-w-[120px]">
            <AnimatePresence mode="wait">
              <motion.span
                key={timer.display}
                className={`text-2xl font-bold tabular-nums font-['Orbitron',sans-serif] ${timerColor(timer.percent)}`}
                animate={
                  pulsando
                    ? { scale: [1, 1.08, 1], opacity: [1, 0.7, 1] }
                    : { scale: 1, opacity: 1 }
                }
                transition={
                  pulsando
                    ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.2 }
                }
              >
                {timer.display}
              </motion.span>
            </AnimatePresence>

            {/* Barra de progresso do timer */}
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full shadow-md ${barColor(timer.percent)} ${barGlow(timer.percent)}`}
                initial={false}
                animate={{ width: `${timer.percent}%` }}
                transition={{ duration: 0.8, ease: "linear" }}
              />
            </div>
          </div>

          {/* Lado direito — Pontuacao + Pause */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                {t("common.score")}
              </span>
              <motion.span
                key={score}
                className="text-lg font-bold text-cyan-300 tabular-nums font-['Space_Grotesk',sans-serif]"
                initial={{ scale: 1.3, color: "#67e8f9" }}
                animate={{ scale: 1, color: "#67e8f9" }}
                transition={{ duration: 0.3 }}
              >
                {score}
              </motion.span>
            </div>

            {/* Botao de pausa */}
            <button
              onClick={onPause}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              title="Pausar"
              aria-label="Pausar jogo"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect
                  x="2"
                  y="1"
                  width="3.5"
                  height="12"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="8.5"
                  y="1"
                  width="3.5"
                  height="12"
                  rx="1"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Linha de progresso: dots (per-term) ou nada (batch) ── */}
        {puzzleMode === "per-term" && (
          <div className="flex items-center justify-center gap-2 mt-3">
            {Array.from({ length: totalStations }, (_, i) => {
              const isCurrent = i === station;
              const isCompleted = i < station;

              return (
                <motion.div
                  key={i}
                  className={`rounded-full transition-colors duration-300 ${
                    isCurrent
                      ? "w-3 h-3 bg-cyan-400 shadow-md shadow-cyan-400/50"
                      : isCompleted
                        ? "w-2.5 h-2.5 bg-emerald-400/80"
                        : "w-2 h-2 bg-white/20"
                  }`}
                  animate={isCurrent ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                  transition={
                    isCurrent
                      ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                      : {}
                  }
                  title={`${t("escape.station", { current: i + 1, total: totalStations })}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
