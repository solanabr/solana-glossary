/**
 * @arquivo ThemeCard.tsx
 * @descricao Card glassmorphism de tema com gradiente e animacao hover
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface ThemeData {
  id: string;
  nameKey: string;
  descKey: string;
  gradient: string;
  border: string;
  glow: string;
  icon: string;
}

interface ThemeCardProps {
  theme: ThemeData;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

// ─── Variante de animacao ───────────────────────────────────────────────────

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// ─── Componente ─────────────────────────────────────────────────────────────

export default function ThemeCard({ theme, t }: ThemeCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6, scale: 1.02 }}
      className={`group relative rounded-2xl p-[1px] bg-gradient-to-br ${theme.gradient}`}
    >
      {/* Interior glassmorphism */}
      <div
        className={`relative rounded-2xl bg-[#0a0015]/80 backdrop-blur-xl p-6 h-full flex flex-col border ${theme.border} ${theme.glow} hover:shadow-xl transition-shadow`}
      >
        {/* Icone */}
        <span className="text-4xl mb-4">{theme.icon}</span>

        {/* Nome do tema */}
        <h3 className="text-xl font-bold text-white mb-2">
          {t(theme.nameKey)}
        </h3>

        {/* Descricao */}
        <p className="text-sm text-gray-400 mb-4 flex-1">{t(theme.descKey)}</p>

        {/* Niveis + botao */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs text-gray-500">
            {t("escape.levelsCount", { count: 4 })}
          </span>
          <Link
            to={`/jogar/${theme.id}/surface`}
            className={`px-5 py-2 rounded-lg bg-gradient-to-r ${theme.gradient} text-white text-sm font-semibold hover:opacity-90 transition-opacity`}
          >
            {t("common.play")}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
