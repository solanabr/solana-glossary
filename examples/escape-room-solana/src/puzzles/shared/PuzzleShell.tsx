/**
 * @arquivo PuzzleShell.tsx
 * @descricao Wrapper visual compartilhado — glassmorphism, animacao entrada/saida
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { ThemeId } from "../../engine/themes";

interface PuzzleShellProps {
  /** Chave para AnimatePresence (trocar reseta animacao) */
  puzzleKey: string | number;
  /** Chave i18n do titulo do puzzle (ex: "puzzle.trueFalse") */
  titleKey: string;
  /** Instrucao para o jogador (chave i18n) */
  hintKey?: string;
  /** Tema visual do puzzle */
  theme?: ThemeId;
  /** Conteudo do puzzle */
  children: React.ReactNode;
}

/** Variantes de animacao — entrada da esquerda, saida pela direita */
const variants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

/** Mapa de estilos CSS por tema */
const THEME_STYLES: Record<ThemeId, { label: string; wrapper: string }> = {
  genesis: {
    label: "text-purple-300",
    wrapper: "puzzle-shell--genesis",
  },
  defi: {
    label: "text-emerald-300",
    wrapper: "puzzle-shell--defi",
  },
  lab: {
    label: "text-sky-300",
    wrapper: "puzzle-shell--lab",
  },
};

export default function PuzzleShell({
  puzzleKey,
  titleKey,
  hintKey,
  theme = "genesis",
  children,
}: PuzzleShellProps) {
  const { t } = useTranslation();
  const style = THEME_STYLES[theme];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={puzzleKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.35 }}
        className={`flex-1 rounded-2xl p-5 ${style.wrapper}`}
      >
        {/* Cabecalho do puzzle */}
        <div className="mb-4">
          <span
            className={`text-xs uppercase tracking-wider font-semibold ${style.label}`}
          >
            {t(titleKey)}
          </span>
          {hintKey && (
            <p className="text-sm text-gray-400 mt-1">{t(hintKey)}</p>
          )}
        </div>

        {/* Conteudo do puzzle */}
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
