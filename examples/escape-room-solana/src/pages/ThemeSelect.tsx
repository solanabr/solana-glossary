/**
 * @arquivo ThemeSelect.tsx
 * @descricao Pagina de selecao de tema — 3 temas com niveis de dificuldade
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import AnimatedBlobs from "../components/AnimatedBlobs";
import { THEMES, type ThemeConfig } from "../engine/themes";
import { getThemeTermCount } from "../lib/glossary";

// ─── Cores por nivel ───────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  surface: "bg-emerald-600/80 hover:bg-emerald-500 border-emerald-400/40",
  confirmation: "bg-yellow-600/80 hover:bg-yellow-500 border-yellow-400/40",
  finality: "bg-orange-600/80 hover:bg-orange-500 border-orange-400/40",
  consensus: "bg-red-600/80 hover:bg-red-500 border-red-400/40",
};

// ─── Icones textuais por tema ──────────────────────────────────────────────

const THEME_ICONS: Record<string, string> = {
  genesis: "GEN",
  defi: "DeFi",
  lab: "LAB",
};

// ─── Animacao stagger ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ─── Card de Tema ──────────────────────────────────────────────────────────

function ThemeCard({ theme }: { theme: ThemeConfig }) {
  const { t } = useTranslation();
  const termCount = getThemeTermCount(theme.id);

  return (
    <motion.div
      variants={cardVariants}
      className="w-full max-w-lg bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg"
    >
      {/* Cabecalho: icone + nome + contagem */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-200 font-['Orbitron',sans-serif] tracking-widest">
          {THEME_ICONS[theme.id] ?? theme.id}
        </span>
        <div>
          <h2 className="text-xl font-bold text-white font-['Space_Grotesk',sans-serif]">
            {t(theme.labelKey)}
          </h2>
          <p className="text-xs text-gray-400">
            {termCount} termos disponiveis
          </p>
        </div>
      </div>

      {/* Botoes de nivel */}
      <div className="flex flex-wrap gap-2">
        {theme.levels.map((level) => (
          <Link
            key={level.id}
            to={`/jogar/${theme.id}/${level.id}`}
            className={`flex-1 min-w-[100px] text-center text-sm font-semibold px-3 py-2.5 rounded-xl border text-white transition-all ${LEVEL_COLORS[level.id] ?? "bg-gray-600"}`}
          >
            {t(`escape.levels.${level.id}`)}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────

export default function ThemeSelect() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="relative min-h-screen bg-[#0a0015] text-white font-['Space_Grotesk',sans-serif]">
        <AnimatedBlobs variant="genesis" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-24">
          {/* Titulo */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold font-['Orbitron',sans-serif] bg-gradient-to-r from-purple-400 via-cyan-400 to-green-400 bg-clip-text text-transparent mb-3 text-center"
          >
            {t("escape.selectTheme")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-gray-400 text-sm mb-10 text-center"
          >
            Escolha um tema e nivel de dificuldade para comecar a fuga.
          </motion.p>

          {/* Cards de tema */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-6 w-full"
          >
            {THEMES.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
