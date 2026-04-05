/**
 * @arquivo ThemeProgressCard.tsx
 * @descricao Card de tema com barra de progresso e desbloqueio de niveis
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { ThemeConfig, LevelId } from "../engine/themes";
import { getThemeTermCount } from "../lib/glossary";
import {
  getNextLevel,
  getCompletedLevels,
  isLevelUnlocked,
  isThemeCompleted,
} from "../lib/progression";

const LVL_COLORS: Record<string, string> = {
  surface: "bg-emerald-600/80 hover:bg-emerald-500 border-emerald-400/40",
  confirmation: "bg-yellow-600/80 hover:bg-yellow-500 border-yellow-400/40",
  finality: "bg-orange-600/80 hover:bg-orange-500 border-orange-400/40",
  consensus: "bg-red-600/80 hover:bg-red-500 border-red-400/40",
};
const LVL_LOCKED =
  "bg-gray-700/40 border-gray-600/30 text-gray-500 cursor-not-allowed";

interface Props {
  theme: ThemeConfig;
  gradient: string;
  icon: string;
}

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function ThemeProgressCard({ theme, gradient, icon }: Props) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const next = getNextLevel(theme.id);
  const completed = getCompletedLevels(theme.id);
  const done = isThemeCompleted(theme.id);
  const termCount = getThemeTermCount(theme.id);

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -4 }}
      className={`group relative rounded-2xl p-[1px] bg-gradient-to-br ${gradient}`}
    >
      <div className="rounded-2xl bg-[#0a0015]/80 backdrop-blur-xl p-6 h-full flex flex-col border border-white/10">
        <span className="text-4xl mb-3">{icon}</span>
        <h3 className="text-xl font-bold text-white mb-1">
          {t(theme.labelKey)}
        </h3>
        <p className="text-xs text-gray-500 mb-1">
          {termCount} {t("home.terms")}
        </p>
        <p className="text-sm text-gray-400 mb-4 flex-1">
          {t(`escape.themes.${theme.id}Desc`)}
        </p>

        {/* Barra de progresso */}
        <div className="flex gap-1 mb-4">
          {theme.levels.map((lvl) => (
            <div
              key={lvl.id}
              className={`h-1.5 flex-1 rounded-full ${
                completed.includes(lvl.id) ? "bg-emerald-400" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Botao principal */}
        <Link
          to={`/jogar/${theme.id}/${next}`}
          className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r ${gradient} text-white hover:opacity-90`}
        >
          {done
            ? t("home.replay")
            : t("home.playLevel", { level: t(`escape.levels.${next}`) })}
        </Link>

        {/* Toggle niveis */}
        {completed.length > 0 && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors text-center"
          >
            {isOpen ? t("home.hideLevels") : t("home.showLevels")}
          </button>
        )}

        {/* Niveis expandidos */}
        {isOpen && (
          <div className="mt-3 flex flex-wrap gap-2">
            {theme.levels.map((lvl) => {
              const unlocked = isLevelUnlocked(theme.id, lvl.id as LevelId);
              const isComp = completed.includes(lvl.id as LevelId);
              return unlocked ? (
                <Link
                  key={lvl.id}
                  to={`/jogar/${theme.id}/${lvl.id}`}
                  className={`flex-1 min-w-[80px] text-center text-xs font-semibold px-2 py-2 rounded-lg border text-white transition-all ${LVL_COLORS[lvl.id]}`}
                >
                  {t(`escape.levels.${lvl.id}`)} {isComp ? "✓" : ""}
                </Link>
              ) : (
                <span
                  key={lvl.id}
                  className={`flex-1 min-w-[80px] text-center text-xs font-semibold px-2 py-2 rounded-lg border ${LVL_LOCKED}`}
                >
                  {t(`escape.levels.${lvl.id}`)} 🔒
                </span>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
