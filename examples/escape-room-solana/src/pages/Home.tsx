/**
 * @arquivo Home.tsx
 * @descricao Landing page com selecao de temas e progressao de niveis
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import AnimatedBlobs from "../components/AnimatedBlobs";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import ThemeProgressCard from "../components/ThemeProgressCard";
import { THEMES } from "../engine/themes";

const THEME_GRAD: Record<string, string> = {
  genesis: "from-purple-600 via-violet-500 to-cyan-400",
  defi: "from-emerald-500 via-teal-400 to-purple-500",
  lab: "from-blue-500 via-orange-400 to-pink-500",
};
const THEME_ICONS: Record<string, string> = {
  genesis: "\u26A1",
  defi: "\uD83D\uDD10",
  lab: "\uD83E\uddEA",
};

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Home() {
  const { t, i18n } = useTranslation();

  return (
    <Layout>
      <div className="relative min-h-screen bg-[#0a0015] text-white overflow-hidden font-['Space_Grotesk',sans-serif]">
        <AnimatedBlobs variant="genesis" />
        <motion.div
          className="relative z-10 flex flex-col items-center px-6 pt-20 pb-12"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={item}
            className="text-5xl md:text-7xl font-extrabold text-center leading-tight mb-4 font-['Orbitron',sans-serif] bg-gradient-to-r from-purple-400 via-cyan-400 to-green-400 bg-clip-text text-transparent"
          >
            {t("escape.title")}
          </motion.h1>
          <motion.p
            variants={item}
            className="text-lg md:text-xl text-gray-400 text-center max-w-xl mb-12"
          >
            {t("escape.subtitle")}
          </motion.p>

          {/* Idioma */}
          <motion.div variants={item} className="flex gap-2 mb-10">
            {["pt-BR", "es"].map((lang) => (
              <button
                key={lang}
                onClick={() => i18n.changeLanguage(lang)}
                className={`text-xs px-4 py-1.5 rounded-full border transition-colors ${
                  i18n.language === lang
                    ? "border-cyan-400 text-cyan-300"
                    : "border-white/20 text-gray-500 hover:text-white"
                }`}
              >
                {lang === "pt-BR" ? "PT-BR" : "ES"}
              </button>
            ))}
          </motion.div>

          {/* Cards de temas com progressao */}
          <motion.div
            variants={container}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-12"
          >
            {THEMES.map((theme) => (
              <ThemeProgressCard
                key={theme.id}
                theme={theme}
                gradient={THEME_GRAD[theme.id]}
                icon={THEME_ICONS[theme.id]}
              />
            ))}
          </motion.div>

          <motion.div variants={item} className="flex gap-4 mb-8">
            <Link
              to="/ranking"
              className="px-6 py-3 rounded-xl border border-white/20 text-gray-300 hover:text-white transition-colors text-sm"
            >
              {t("common.leaderboard")}
            </Link>
          </motion.div>

          <motion.button
            variants={item}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity mb-16"
          >
            {t("common.connectWallet")}
          </motion.button>

          <motion.div variants={item}>
            <Footer />
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
